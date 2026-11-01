"""Runs the generated lua code of the radio blocks in Lua 5.3, with a simulated firmware.

Like on iCOMpadre, the bytes of the answers of the radio are floats (the firmware uses lua_pushnumber),
e.g. tostring(18.0) is "18.0" and not "18". Needs the python package lupa (pip install lupa).
"""
import json
import re
import sys

try:
    from lupa import lua53
except ImportError:
    sys.exit("The python package lupa is missing: pip install lupa")

from harness import Browser, Checks, Server, generate_all, open_studio

# The functions of the firmware which the radio blocks use
FIRMWARE = r"""
sent = {}
answers = {}   -- e.g. answers["1A 05 01 58"] = {0x20, 0x26, 0x10, 0x31}
function key(cmd)
  local t = {}
  for i, b in ipairs(cmd) do t[i] = string.format("%02X", math.floor(b)) end
  return table.concat(t, " ")
end
function sendCommand(cmd, data)
  local all = {}
  for _, b in ipairs(cmd) do all[#all + 1] = b end
  for _, b in ipairs(data or {}) do all[#all + 1] = b end
  sent[#sent + 1] = key(all)
  return cmd
end
function readResultOfCommand(cmd)
  local a = answers[key(cmd)]
  if a == nil then return nil end
  local t = {}
  for i, b in ipairs(a) do t[i] = b + 0.0 end   -- floats, like lua_pushnumber in the firmware
  return t
end
"""

# Every answer has this data, if a test doesn't set its own
ANY_ANSWER = ("setmetatable(answers, {__index = function() return {0x01, 0x20, 0x45, 0x67, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,"
              " 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x24, 0x10, 0x31, 0x12, 0x30, 0x15} end})")


# The helper functions of every option of the ring buffer block (the toolbox only generates the first option)
RING_BUFFER_HELPERS = r"""
(function() {
  var out = {};
  var ws = new Blockly.Workspace();
  var block = ws.newBlock('ringbuffer_get');
  block.getField('WHAT').getOptions().forEach(function(option) {
    block.setFieldValue(option[1], 'WHAT');
    Blockly.Lua.init(ws);
    Blockly.Lua.blockToCode(block);
    Object.assign(out, Blockly.Lua.definitions_);
  });
  ws.dispose();
  return JSON.stringify(out);
})()
"""


def runtime(answers=None, helpers=None):
    lua = lua53.LuaRuntime(unpack_returned_tuples=True)
    lua.execute(FIRMWARE)
    for key, data in (answers or {}).items():
        lua.execute('answers["%s"] = {%s}' % (key, ", ".join(str(b) for b in data)))
    for code in (helpers or []):
        lua.execute(code)
    return lua


def as_function(code):
    """A program of a value block ends with "local _ = expression": return the expression instead"""
    return re.sub(r"^local _ = (.*)$", r"return \1", code, flags=re.M)


def main():
    checks = Checks()
    server, browser = Server(), Browser()
    try:
        open_studio(browser.page, server)
        generated = generate_all(browser.page)
        prefixes = browser.page.eval("Icom.radios.map(function(r) { return r.spec.prefix + '_'; })") + ["ic705_"]
        ring_helpers = json.loads(browser.page.eval(RING_BUFFER_HELPERS))
    finally:
        browser.close()
        server.close()

    full, helpers = generated["full"], dict(generated["helpers"], **ring_helpers)
    radio_blocks = sorted(k for k in full if k.startswith(tuple(prefixes)))

    # 1. every radio block runs: right after the start (no answers yet) and with answers
    failures = []
    for name in radio_blocks:
        for with_answers in (False, True):
            lua = runtime()
            if with_answers:
                lua.execute(ANY_ANSWER)
            try:
                lua.execute(as_function(full[name]))
            except Exception as e:
                failures.append("%s (%s): %s" % (name, "with answers" if with_answers else "no answers", str(e)[:150]))
    checks.check("%d radio blocks run without and with answers" % len(radio_blocks), not failures, failures)

    # 2. values of read blocks with known answers
    def value(label, block, answers, expected):
        got = runtime(answers).execute(as_function(full[block]))
        ok = abs(got - expected) < 0.051 if isinstance(expected, float) else got == expected
        checks.check(label, ok, repr(got))

    value("IC-7610 mode PSK (answer 12 01)", "ic7610_get_operating_mode", {"04": [0x12, 0x01]}, "PSK")
    value("IC-7610 attenuator 12 dB (BCD 12)", "ic7610_get_attenuator", {"11": [0x12]}, "12 dB")
    value("IC-7610 AGC MID", "ic7610_get_agc", {"16 12": [0x02]}, "MID")
    value("IC-7610 preamp P.AMP2", "ic7610_get_preamp", {"16 02": [0x02]}, "P.AMP2")
    value("IC-7610 data mode DATA2 is on", "ic7610_is_data_mode", {"1A 06": [0x02, 0x01]}, True)
    value("IC-7610 dualwatch on", "ic7610_is_dualwatch", {"07 C2": [0x01]}, True)
    value("IC-7610 S-meter S9 (0120)", "ic7610_get_s_meter", {"15 02": [0x01, 0x20]}, 9.0)
    value("IC-7610 Id 20 A (0165)", "ic7610_get_supply_current", {"15 16": [0x01, 0x65]}, 20.0)
    value("IC-7610 clock 13:45", "ic7610_get_clock", {"1A 05 01 58": [0x20, 0x26, 0x10, 0x31], "1A 05 01 59": [0x13, 0x45]}, "13:45")
    value("IC-7851 power 200 W (0213)", "ic7851_get_power_output", {"15 11": [0x02, 0x13]}, 200.0)
    value("IC-7851 Vd 48 V (0180)", "ic7851_get_supply_voltage", {"15 15": [0x01, 0x80]}, 48.0)
    value("IC-7851 AGC OFF", "ic7851_get_agc", {"16 12": [0x00]}, "OFF")
    value("IC-9700 mode DV", "ic9700_get_operating_mode", {"04": [0x17, 0x01]}, "DV")
    value("IC-9700 preamp and external preamp", "ic9700_get_preamp", {"16 02": [0x03]}, "P.AMP and EXT-P.AMP")
    value("IC-9700 Vd 10 V (0013)", "ic9700_get_supply_voltage", {"15 15": [0x00, 0x13]}, 10.0)
    value("IC-2730 mode FM-N (05 02)", "ic2730_get_operating_mode", {"04": [0x05, 0x02]}, "FM-N")
    value("IC-2730 RF power MID (0100)", "ic2730_get_rf_power", {"14 0A": [0x01, 0x00]}, "MID")
    value("IC-2730 RF power LOW (0084)", "ic2730_get_rf_power", {"14 0A": [0x00, 0x84]}, "LOW")
    value("IC-2730 S9 (0170)", "ic2730_get_s_meter", {"15 02": [0x01, 0x70]}, 9.0)
    value("IC-2730 reversed tone squelch counts as on", "ic2730_is_function_on", {"16 42": [0x02]}, True)
    value("IC-A120E mode AM-N", "ica120e_get_operating_mode", {"04": [0x02, 0x02]}, "AM-N")
    value("IC-A120E squelch status from 15 05", "ica120e_is_squelch_open", {"15 05": [0x01]}, True)
    value("mode is Unknown before the first answer", "ic7610_get_operating_mode", {}, "Unknown")
    value("attenuator is empty before the first answer", "ic7610_get_attenuator", {}, "")
    value("IC-705 tone function TONE(T)/TSQL(R)", "ic705_get_tone_function", {"16 5D": [0x09]}, "TONE(T)/TSQL(R)")
    value("IC-705 break-in full", "ic705_get_break_in", {"16 47": [0x02]}, "full")
    value("IC-705 COMP meter 15 dB (0130)", "ic705_get_comp_meter", {"15 14": [0x01, 0x30]}, 15.0)
    value("IC-705 DTCS code 754", "ic705_get_dtcs_code", {"1B 02": [0x00, 0x07, 0x54]}, 754)
    value("IC-705 compressor level 5 (0128)", "ic705_get_comp_level", {"14 0E": [0x01, 0x28]}, 5.0)

    # 3. the helper functions with values
    def helper(label, names, expression, expected):
        lua = runtime(helpers=[helpers[n] for n in names])
        got = lua.eval(expression)
        if hasattr(got, "values"):
            got = list(got.values())
        checks.check(label, got == expected, repr(got))

    helper("IC-705 DTCS data 023 TX reverse", ["icomDtcsData"], "icomDtcsData(23, 0x10)", [0x10, 0, 0x23])
    helper("IC-705 menu command 0312", ["numberToBcd", "icomMenuCmd"], "icomMenuCmd(312)", [0x1A, 0x05, 0x03, 0x12])
    helper("IC-705 CW pitch 600 Hz is 0128", ["numberToBcd", "icomLevel"], "icomLevel(600, 300, 900)", [0x01, 0x28])

    # the ring buffer: the values are floats on the device as well, e.g. the answers of the radio
    ring = ["ringAdd", "ringCount", "ringSum", "ringAverage", "ringMin", "ringMax", "ringRange", "ringMedian", "ringStdDev",
            "ringNewest", "ringOldest", "ringChange"]
    fill = "(function() local b; for _, v in ipairs({%s}) do b = ringAdd(b, v, %s) end return %s end)()"

    helper("ring buffer keeps the last values, oldest first", ring, fill % ("1, 2, 3, 4, 5", "3", "b"), [3, 4, 5])
    helper("ring buffer not full yet", ring, fill % ("1, 2", "3", "b"), [1, 2])
    helper("ring buffer with size 0 keeps one value", ring, fill % ("1, 2", "0", "b"), [2])
    helper("ring buffer with a negative size keeps one value", ring, fill % ("1, 2", "-5", "b"), [2])
    helper("ring buffer gets smaller with a smaller size", ring, "ringAdd({1, 2, 3, 4}, 5, 2)", [4, 5])
    helper("ring buffer takes floats", ring, fill % ("1.5, 2.5", "3", "b"), [1.5, 2.5])

    for function, expected in (("ringAverage", 4), ("ringMin", 1), ("ringMax", 9), ("ringRange", 8), ("ringMedian", 3), ("ringSum", 20),
                               ("ringNewest", 3), ("ringOldest", 2), ("ringChange", 1), ("ringCount", 5)):
        helper("ring buffer %s" % function, ring, fill % ("2, 9, 1, 5, 3", "5", function + "(b)"), expected)
    helper("ring buffer median of an even number of values", ring, "ringMedian({4, 1, 3, 2})", 2.5)
    helper("ring buffer median does not sort the buffer", ring, "(function() local b = {3, 1, 2}; ringMedian(b); return b end)()", [3, 1, 2])
    helper("ring buffer standard deviation", ring, "ringStdDev({2, 4, 4, 4, 5, 5, 7, 9})", 2)

    for function in ("ringAverage", "ringMin", "ringMax", "ringRange", "ringMedian", "ringStdDev", "ringSum", "ringNewest", "ringOldest",
                     "ringChange", "ringCount"):
        helper("ring buffer %s is 0 before the first value" % function, ring, function + "(nil)", 0)
        helper("ring buffer %s is 0 when it is empty" % function, ring, function + "({})", 0)

    # 4. what the action blocks send
    def sends(label, block, expected):
        lua = runtime()
        lua.execute(full[block])
        got = list(lua.eval("sent").values())
        checks.check(label, got == expected, got)

    sends("IC-2730 set RF power LOW", "ic2730_set_rf_power", ["14 0A 00 42"])
    sends("IC-2730 set mode FM with filter", "ic2730_set_operating_mode", ["06 05 01"])
    sends("IC-7610 select memory: memory mode, then channel", "ic7610_select_memory", ["08", "08 00 00"])
    sends("IC-9700 select VFO A", "ic9700_select_vfo", ["07 00"])

    return checks.done()


if __name__ == "__main__":
    sys.exit(main())

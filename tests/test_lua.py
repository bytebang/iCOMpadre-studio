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

NESTED_LUA_TABLE = r"""
(function() {
  var ws = new Blockly.Workspace();
  var outer = ws.newBlock('lua_table');
  var inner = ws.newBlock('lua_table');
  var outerFirst = outer.getInputTargetBlock('STACK');
  var outerSecond = ws.newBlock('lua_table_entry');
  outerFirst.nextConnection.connect(outerSecond.previousConnection);
  var innerFirst = inner.getInputTargetBlock('STACK');
  var innerSecond = ws.newBlock('lua_table_entry');
  innerFirst.nextConnection.connect(innerSecond.previousConnection);
  function text(value) {
    var block = ws.newBlock('text');
    block.setFieldValue(value, 'TEXT');
    return block;
  }
  function connectText(parent, input, value) {
    parent.getInput(input).connection.connect(text(value).outputConnection);
  }
  connectText(outerFirst, 'KEY', 'rdbutton_SchalteZuOe3');
  outerFirst.getInput('VALUE').connection.connect(inner.outputConnection);
  connectText(innerFirst, 'KEY', 'title');
  connectText(innerFirst, 'VALUE', 'Ö3');
  connectText(innerSecond, 'KEY', 'description');
  connectText(innerSecond, 'VALUE', 'Schaltet auf Ö3 bei 98,6 MHz.');
  connectText(outerSecond, 'KEY', 'rdbutton_SchalteZuLocal');
  connectText(outerSecond, 'VALUE', 'Lokal');
  var variable = ws.getVariableMap().createVariable('btn_Info');
  var setter = ws.newBlock('variables_set');
  setter.setFieldValue(variable.getId(), 'VAR');
  setter.getInput('VALUE').connection.connect(outer.outputConnection);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

MIXED_LUA_TABLE = r"""
(function() {
  var ws = new Blockly.Workspace();
  var table = ws.newBlock('lua_table');
  var first = table.getInputTargetBlock('STACK');
  var second = ws.newBlock('lua_table_list_item');
  var third = ws.newBlock('lua_table_entry');
  first.nextConnection.connect(second.previousConnection);
  second.nextConnection.connect(third.previousConnection);
  function text(value) {
    var block = ws.newBlock('text');
    block.setFieldValue(value, 'TEXT');
    return block;
  }
  first.getInput('KEY').connection.connect(text('name').outputConnection);
  first.getInput('VALUE').connection.connect(text('Ö3').outputConnection);
  second.getInput('VALUE').connection.connect(text('Lokal').outputConnection);
  third.getInput('KEY').connection.connect(text('frequency').outputConnection);
  var frequency = ws.newBlock('math_number');
  frequency.setFieldValue('98.6', 'NUM');
  third.getInput('VALUE').connection.connect(frequency.outputConnection);
  var variable = ws.getVariableMap().createVariable('channels');
  var setter = ws.newBlock('variables_set');
  setter.setFieldValue(variable.getId(), 'VAR');
  setter.getInput('VALUE').connection.connect(table.outputConnection);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

LUA_TABLE_MIXED_MUTATOR = r"""
(function() {
  var sourceHost = document.createElement('div');
  var mutatorHost = document.createElement('div');
  sourceHost.style.display = 'none';
  mutatorHost.style.display = 'none';
  document.body.appendChild(sourceHost);
  document.body.appendChild(mutatorHost);
  var ws = Blockly.inject(sourceHost, {});
  var mutatorWorkspace = Blockly.inject(mutatorHost, {});
  try {
    var table = ws.newBlock('lua_table');
    var first = table.getInputTargetBlock('STACK');
    var second = ws.newBlock('lua_table_list_item');
    first.nextConnection.connect(second.previousConnection);
    function text(value) {
      var block = ws.newBlock('text');
      block.setFieldValue(value, 'TEXT');
      return block;
    }
    first.getInput('KEY').connection.connect(text('first').outputConnection);
    first.getInput('VALUE').connection.connect(text('one').outputConnection);
    second.getInput('VALUE').connection.connect(text('two').outputConnection);
    function rows() {
      var result = [];
      var row = table.getInputTargetBlock('STACK');
      while (row) {
        result.push({
          type: row.type,
          key: row.type == 'lua_table_entry' && row.getInputTargetBlock('KEY') ?
            row.getInputTargetBlock('KEY').getFieldValue('TEXT') : null,
          value: row.getInputTargetBlock('VALUE') && row.getInputTargetBlock('VALUE').getFieldValue('TEXT')
        });
        row = row.getNextBlock();
      }
      return result;
    }
    function changeSecondType(type) {
      var container = table.decompose(mutatorWorkspace);
      table.saveConnections(container);
      container.getInputTargetBlock('STACK').getNextBlock().setFieldValue(type, 'TYPE');
      table.compose(container);
      container.dispose(false);
      return rows();
    }
    var original = rows();
    var asKeyValue = changeSecondType('key_value');
    var asListItem = changeSecondType('list');
    return JSON.stringify({original: original, asKeyValue: asKeyValue, asListItem: asListItem});
  } finally {
    ws.dispose();
    mutatorWorkspace.dispose();
    sourceHost.remove();
    mutatorHost.remove();
  }
})()
"""

EMPTY_LUA_TABLE = r"""
(function() {
  var ws = new Blockly.Workspace();
  var table = ws.newBlock('lua_table');
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.blockToCode(table)[0];
  ws.dispose();
  return code;
})()
"""

STANDALONE_LUA_TABLE_ENTRY = r"""
(function() {
  var ws = new Blockly.Workspace();
  var entry = ws.newBlock('lua_table_entry');
  var key = ws.newBlock('text');
  key.setFieldValue('standalone', 'TEXT');
  var value = ws.newBlock('text');
  value.setFieldValue('safe', 'TEXT');
  entry.getInput('KEY').connection.connect(key.outputConnection);
  entry.getInput('VALUE').connection.connect(value.outputConnection);
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

STANDALONE_LUA_TABLE_LIST_ITEM = r"""
(function() {
  var ws = new Blockly.Workspace();
  var item = ws.newBlock('lua_table_list_item');
  var value = ws.newBlock('text');
  value.setFieldValue('standalone', 'TEXT');
  item.getInput('VALUE').connection.connect(value.outputConnection);
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

INCOMPLETE_LUA_TABLE_LIST_ITEM = r"""
(function() {
  var ws = new Blockly.Workspace();
  var item = ws.newBlock('lua_table_list_item');
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

INCOMPLETE_LUA_TABLE_ENTRY = r"""
(function() {
  var ws = new Blockly.Workspace();
  var entry = ws.newBlock('lua_table_entry');
  var key = ws.newBlock('text');
  key.setFieldValue('incomplete', 'TEXT');
  entry.getInput('KEY').connection.connect(key.outputConnection);
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

LUA_TABLE_ENTRY_WARNINGS = r"""
(function() {
  var host = document.createElement('div');
  host.style.display = 'none';
  document.body.appendChild(host);
  var ws = Blockly.inject(host, {});
  try {
    var first = ws.newBlock('lua_table_entry');
    var second = ws.newBlock('lua_table_list_item');
    var third = ws.newBlock('lua_table_entry');
    first.nextConnection.connect(second.previousConnection);
    second.nextConnection.connect(third.previousConnection);
    first.onchange();
    second.onchange();
    third.onchange();
    var standaloneWarnings = [first, second, third].map(function(block) {
      return block.getIcons().filter(function(icon) {
        return icon.getText() == Blockly.Msg.ICP_LUA_TABLE_ENTRY_STANDALONE_WARNING;
      }).length;
    });
    var table = ws.newBlock('lua_table');
    var row = table.getInputTargetBlock('STACK');
    row.onchange();
    var listItem = ws.newBlock('lua_table_list_item');
    row.nextConnection.connect(listItem.previousConnection);
    listItem.onchange();
    var tableWarnings = row.getIcons().concat(listItem.getIcons()).filter(function(icon) {
      return icon.getText() == Blockly.Msg.ICP_LUA_TABLE_ENTRY_STANDALONE_WARNING;
    }).length;
    return JSON.stringify({standalone: standaloneWarnings, inTable: tableWarnings});
  } finally {
    ws.dispose();
    host.remove();
  }
})()
"""

LUA_TABLE_LOOKUP = r"""
(function() {
  var ws = new Blockly.Workspace();
  var table = ws.newBlock('lua_table');
  var first = table.getInputTargetBlock('STACK');
  function text(value) {
    var block = ws.newBlock('text');
    block.setFieldValue(value, 'TEXT');
    return block;
  }
  first.getInput('KEY').connection.connect(text('title').outputConnection);
  first.getInput('VALUE').connection.connect(text('Ö3').outputConnection);
  var listItem = ws.newBlock('lua_table_list_item');
  first.nextConnection.connect(listItem.previousConnection);
  listItem.getInput('VALUE').connection.connect(text('not a key').outputConnection);
  var second = ws.newBlock('lua_table_entry');
  listItem.nextConnection.connect(second.previousConnection);
  second.getInput('KEY').connection.connect(text('description').outputConnection);
  second.getInput('VALUE').connection.connect(text('Station').outputConnection);
  var variable = ws.getVariableMap().createVariable('btn_Info');
  var setter = ws.newBlock('variables_set');
  setter.setFieldValue(variable.getId(), 'VAR');
  setter.getInput('VALUE').connection.connect(table.outputConnection);
  var lookup = ws.newBlock('lua_table_get');
  lookup.setFieldValue(variable.getId(), 'VAR');
  var keyField = lookup.getField('KEY');
  var options = keyField.getOptions(false);
  keyField.setValue('text:description');
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.blockToCode(lookup)[0];
  ws.dispose();
  return JSON.stringify({options: options, code: code});
})()
"""

LUA_TABLE_SET = r"""
(function() {
  var ws = new Blockly.Workspace();
  var table = ws.newBlock('lua_table');
  var first = table.getInputTargetBlock('STACK');
  function text(value) {
    var block = ws.newBlock('text');
    block.setFieldValue(value, 'TEXT');
    return block;
  }
  first.getInput('KEY').connection.connect(text('title').outputConnection);
  first.getInput('VALUE').connection.connect(text('old').outputConnection);
  var variable = ws.getVariableMap().createVariable('btn_Info');
  var setter = ws.newBlock('variables_set');
  setter.setFieldValue(variable.getId(), 'VAR');
  setter.getInput('VALUE').connection.connect(table.outputConnection);
  var set = ws.newBlock('lua_table_set');
  set.setFieldValue(variable.getId(), 'VAR');
  set.getField('KEY').setValue('text:title');
  set.getInput('VALUE').connection.connect(text('updated').outputConnection);
  Blockly.Lua.init(ws);
  var code = Blockly.Lua.workspaceToCode(ws);
  ws.dispose();
  return code;
})()
"""

LUA_TABLE_MUTATOR = r"""
(function() {
  var sourceHost = document.createElement('div');
  var mutatorHost = document.createElement('div');
  sourceHost.style.display = 'none';
  mutatorHost.style.display = 'none';
  document.body.appendChild(sourceHost);
  document.body.appendChild(mutatorHost);
  var sourceWorkspace = Blockly.inject(sourceHost, {});
  var mutatorWorkspace = Blockly.inject(mutatorHost, {});
  try {
    var table = sourceWorkspace.newBlock('lua_table');
    function text(value) {
      var block = sourceWorkspace.newBlock('text');
      block.setFieldValue(value, 'TEXT');
      return block;
    }
    function setEntry(entry, key, value) {
      entry.getInput('KEY').connection.connect(text(key).outputConnection);
      entry.getInput('VALUE').connection.connect(text(value).outputConnection);
    }
    function rows() {
      var result = [];
      var entry = table.getInputTargetBlock('STACK');
      while (entry) {
        result.push([
          entry.getInputTargetBlock('KEY') && entry.getInputTargetBlock('KEY').getFieldValue('TEXT'),
          entry.getInputTargetBlock('VALUE') && entry.getInputTargetBlock('VALUE').getFieldValue('TEXT')
        ]);
        entry = entry.getNextBlock();
      }
      return result;
    }

    var first = table.getInputTargetBlock('STACK');
    setEntry(first, 'key1', 'value1');
    var second = sourceWorkspace.newBlock('lua_table_entry');
    first.nextConnection.connect(second.previousConnection);
    setEntry(second, 'key2', 'value2');

    var container = table.decompose(mutatorWorkspace);
    table.saveConnections(container);
    var firstItem = container.getInputTargetBlock('STACK');
    var secondItem = firstItem.getNextBlock();
    firstItem.nextConnection.disconnect();
    container.getInput('STACK').connection.disconnect();
    container.getInput('STACK').connection.connect(secondItem.previousConnection);
    secondItem.nextConnection.connect(firstItem.previousConnection);
    table.compose(container);
    var reordered = rows();

    container = table.decompose(mutatorWorkspace);
    table.saveConnections(container);
    firstItem = container.getInputTargetBlock('STACK');
    secondItem = firstItem.getNextBlock();
    firstItem.nextConnection.disconnect();
    container.getInput('STACK').connection.disconnect();
    container.getInput('STACK').connection.connect(secondItem.previousConnection);
    table.compose(container);
    var afterRemovingFirst = rows();

    return JSON.stringify({reordered: reordered, afterRemovingFirst: afterRemovingFirst});
  } finally {
    sourceWorkspace.dispose();
    mutatorWorkspace.dispose();
    sourceHost.remove();
    mutatorHost.remove();
  }
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
        nested_table = browser.page.eval(NESTED_LUA_TABLE)
        mixed_table = browser.page.eval(MIXED_LUA_TABLE)
        mixed_mutator = json.loads(browser.page.eval(LUA_TABLE_MIXED_MUTATOR))
        empty_table = browser.page.eval(EMPTY_LUA_TABLE)
        standalone_entry = browser.page.eval(STANDALONE_LUA_TABLE_ENTRY)
        standalone_list_item = browser.page.eval(STANDALONE_LUA_TABLE_LIST_ITEM)
        incomplete_list_item = browser.page.eval(INCOMPLETE_LUA_TABLE_LIST_ITEM)
        incomplete_entry = browser.page.eval(INCOMPLETE_LUA_TABLE_ENTRY)
        table_entry_warnings = json.loads(browser.page.eval(LUA_TABLE_ENTRY_WARNINGS))
        table_lookup = json.loads(browser.page.eval(LUA_TABLE_LOOKUP))
        table_set = browser.page.eval(LUA_TABLE_SET)
        table_mutator = json.loads(browser.page.eval(LUA_TABLE_MUTATOR))
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

    table_lua = runtime()
    table_lua.execute(nested_table)
    checks.check("nested key-value tables assign a named variable with formatted Lua",
                 table_lua.globals().btn_Info["rdbutton_SchalteZuOe3"]["title"] == "Ö3" and
                 table_lua.globals().btn_Info["rdbutton_SchalteZuOe3"]["description"] ==
                 "Schaltet auf Ö3 bei 98,6 MHz." and
                 table_lua.globals().btn_Info["rdbutton_SchalteZuLocal"] == "Lokal",
                 nested_table)
    checks.check("key-value table rows are separate inline Blockly blocks",
                 "  ['rdbutton_SchalteZuOe3'] = {" in nested_table and
                 "    ['title'] = " in nested_table and
                 nested_table.count("\n  [") >= 2,
                 nested_table)
    mixed_runtime = runtime()
    mixed_runtime.execute(mixed_table)
    mixed_channels = mixed_runtime.globals().channels
    checks.check("tables combine list items and key-value pairs",
                 mixed_channels["name"] == "Ö3" and mixed_channels[1] == "Lokal" and
                 mixed_channels["frequency"] == 98.6,
                 mixed_table)
    checks.check("table mutator preserves values when changing row types",
                 mixed_mutator["original"] == [
                     {"type": "lua_table_entry", "key": "first", "value": "one"},
                     {"type": "lua_table_list_item", "key": None, "value": "two"}
                 ] and
                 mixed_mutator["asKeyValue"][1]["type"] == "lua_table_entry" and
                 mixed_mutator["asKeyValue"][1]["value"] == "two" and
                 mixed_mutator["asListItem"][1]["type"] == "lua_table_list_item" and
                 mixed_mutator["asListItem"][1]["value"] == "two",
                 mixed_mutator)
    checks.check("empty key-value row is omitted from generated table",
                 empty_table == "{\n}",
                 repr(empty_table))
    standalone_runtime = runtime()
    try:
        standalone_runtime.execute(standalone_entry)
        standalone_valid = True
        standalone_error = ""
    except Exception as error:
        standalone_valid = False
        standalone_error = str(error)
    checks.check("standalone key-value pair generates valid Lua",
                 standalone_valid and "local _ = { ['standalone'] = 'safe' }" in standalone_entry,
                 standalone_error or standalone_entry)
    checks.check("incomplete standalone key-value pair is omitted",
                 incomplete_entry == "",
                 repr(incomplete_entry))
    standalone_list_runtime = runtime()
    try:
        standalone_list_runtime.execute(standalone_list_item)
        standalone_list_valid = True
        standalone_list_error = ""
    except Exception as error:
        standalone_list_valid = False
        standalone_list_error = str(error)
    checks.check("standalone list item generates valid Lua",
                 standalone_list_valid and "local _ = {'standalone'}" in standalone_list_item,
                 standalone_list_error or standalone_list_item)
    checks.check("incomplete standalone list item is omitted",
                 incomplete_list_item == "",
                 repr(incomplete_list_item))
    checks.check("a standalone chain of table rows shows only one warning",
                 table_entry_warnings["standalone"] == [1, 0, 0],
                 table_entry_warnings["standalone"])
    checks.check("table rows show no standalone warning",
                 table_entry_warnings["inTable"] == 0,
                 table_entry_warnings["inTable"])
    checks.check("table lookup dropdown contains keys from the selected variable",
                 [option[1] for option in table_lookup["options"]] == ["text:title", "text:description"],
                 table_lookup["options"])
    checks.check("table lookup generates a Lua index expression",
                 table_lookup["code"] == "btn_Info['description']",
                 table_lookup["code"])
    table_update_runtime = runtime()
    table_update_runtime.execute(table_set)
    checks.check("table set block updates the selected table value",
                 table_update_runtime.globals().btn_Info["title"] == "updated",
                 table_set)
    checks.check("key-value table mutator reorders entries without losing values",
                 table_mutator["reordered"] == [["key2", "value2"], ["key1", "value1"]],
                 table_mutator["reordered"])
    checks.check("key-value table mutator removes entries without shifting values",
                 table_mutator["afterRemovingFirst"] == [["key1", "value1"]],
                 table_mutator["afterRemovingFirst"])

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

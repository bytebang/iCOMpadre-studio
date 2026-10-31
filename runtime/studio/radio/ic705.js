// Blocks for the ICOM IC-705.
//
// The CI-V commands are described in the "IC-705 CI-V reference guide" (datasheets/radio-docs/IC-705),
// the page numbers in the comments refer to it.
//
// How the firmware handles commands:
// - sendCommand(cmd[, data]) sends the bytes of cmd and data and returns cmd
// - readResultOfCommand(cmd) returns the data of the last answer to cmd, or nil if there was none yet.
//   The answer is matched by its command bytes. The library takes 2 bytes as command for
//   07 0E 13 14 15 16 19 1A 1B 1C 1E 21 27, 4 bytes for 1A 05 and 1 byte for all others.
//   So e.g. "23 00" has to be read as sendCommand({0x23}, {0x00}).
//
// Documentation of the blocks: documentation/blocks/radio/ic705.md

// Register the contribution of this file: one category with a group per topic, all in the colour "radio"
var ic705 = Studio.category("IC-705", "radio");
var ic705Frequency = ic705.group("Frequency & Mode");
var ic705Receiver  = ic705.group("Receiver");
var ic705Transmit  = ic705.group("Transmit");
var ic705Meters    = ic705.group("Meters");
var ic705CwVoice   = ic705.group("CW & Voice");
var ic705Gps       = ic705.group("GPS & Time");
var ic705Settings  = ic705.group("Settings");

var IC705_ON_OFF = [["on", "0x01"], ["off", "0x00"]];

// Lua code of a value input, "0" if nothing is connected
function ic705Value(block, name, order)
{
  return Blockly.Lua.valueToCode(block, name, order || lua.Order.NONE) || '0';
}

// Warns while editing, if a plain number at the input is out of range
function ic705CheckRange(block, name, min, max, text)
{
  var input = block.getInputTargetBlock(name);
  var value = (input && input.type == 'math_number') ? Number(input.getFieldValue('NUM')) : null;
  block.setWarningText(value !== null && (value < min || value > max) ? text : null);
}

/* **************************************************************** */
/*                          LUA FUNCTIONS                           */
/* **************************************************************** */
// Lua functions of the IC-705 -> pull them into the generated code with Studio.use(...)

// Name of the operating mode in the answer of command 04 (p. 16)
Studio.luaFunction('getOperatingModeString', [
  'function getOperatingModeString(responseTable)',
  '  if responseTable == nil or responseTable[1] == nil then',
  '    return "Unknown"',
  '  end',
  '  local reponseByte = string.format("0x%02x", responseTable[1])',
  '  local modeMap = {',
  '    ["0x00"] = \'LSB\',',
  '    ["0x01"] = \'USB\',',
  '    ["0x02"] = \'AM\',',
  '    ["0x03"] = \'CW\',',
  '    ["0x04"] = \'RTTY\',',
  '    ["0x05"] = \'FM\',',
  '    ["0x06"] = \'WFM\',',
  '    ["0x07"] = \'CW-R\',',
  '    ["0x08"] = \'RTTY-R\',',
  '    ["0x17"] = \'DV\'',
  '  }',
  '  return modeMap[reponseByte] or "Unknown"',
  'end'
]);

// Sends a read command and returns the data of the last answer, or an empty table if there was none yet
Studio.luaFunction('ic705Query', [
  'function ic705Query(cmd, data)',
  '  local key',
  '  if data then key = sendCommand(cmd, data) else key = sendCommand(cmd) end',
  '  if key == nil then return {} end',
  '  return readResultOfCommand(key) or {}',
  'end'
]);

// Reads a BCD value (e.g. 0000 ~ 0255), 0 if there is no answer yet
Studio.luaFunction('ic705ReadNumber', [
  'function ic705ReadNumber(cmd, data)',
  '  local d = ic705Query(cmd, data)',
  '  if #d == 0 then return 0 end',
  '  return bcdToNumber(d) or 0',
  'end'
], ['ic705Query', 'bcdToNumber']);

// Reads a level 0000 ~ 0255 in %
Studio.luaFunction('ic705ReadPercent', [
  'function ic705ReadPercent(cmd)',
  '  return math.floor(ic705ReadNumber(cmd) * 100 / 255 + 0.5)',
  'end'
], ['ic705ReadNumber']);

// Reads the first byte of the answer, 0 if there is no answer yet
Studio.luaFunction('ic705ReadByte', [
  'function ic705ReadByte(cmd, data)',
  '  return ic705Query(cmd, data)[1] or 0',
  'end'
], ['ic705Query']);

// Reads a 00=OFF / 01=ON setting
Studio.luaFunction('ic705ReadOn', [
  'function ic705ReadOn(cmd)',
  '  return ic705ReadByte(cmd) == 1',
  'end'
], ['ic705ReadByte']);

// Converts 0 ~ 100 % into the 2 byte BCD level 0000 ~ 0255
Studio.luaFunction('ic705Percent', [
  'function ic705Percent(percent)',
  '  percent = math.max(0, math.min(100, percent))',
  '  return numberToBcd(math.floor(percent * 255 / 100 + 0.5), 2)',
  'end'
], ['numberToBcd']);

// Reads the operating frequency in Hz (command 03, p. 16), 0 if there is no answer yet
Studio.luaFunction('ic705ReadFrequency', [
  'function ic705ReadFrequency()',
  '  local d = ic705Query({0x03})',
  '  if #d == 0 then return 0 end',
  '  return frequencyAsNumber(d)',
  'end'
], ['ic705Query', 'frequencyAsNumber']);

// Linear interpolation between the points {{raw, value}, ...} of a meter scale
Studio.luaFunction('ic705Scale', [
  'function ic705Scale(raw, points)',
  '  for i = 2, #points do',
  '    if raw <= points[i][1] or i == #points then',
  '      local x0, y0, x1, y1 = points[i-1][1], points[i-1][2], points[i][1], points[i][2]',
  '      return y0 + (raw - x0) * (y1 - y0) / (x1 - x0)',
  '    end',
  '  end',
  '  return points[1][2]',
  'end'
]);

// Reads a meter (command 15) and converts it with its scale, rounded to 0.1
Studio.luaFunction('ic705Meter', [
  'function ic705Meter(cmd, points)',
  '  return math.floor(ic705Scale(ic705ReadNumber(cmd), points) * 10 + 0.5) / 10',
  'end'
], ['ic705ReadNumber', 'ic705Scale']);

// Converts a text into ASCII codes for the CW message (command 17, max. 30 characters, p. 16)
Studio.luaFunction('ic705TextBytes', [
  'function ic705TextBytes(text)',
  '  local t = {}',
  '  text = tostring(text)',
  '  for i = 1, math.min(#text, 30) do',
  '    t[i] = string.byte(text, i)',
  '  end',
  '  return t',
  'end'
]);

// Converts 6 ~ 48 WPM into the keying speed level 0000 ~ 0255 (command 14 0C)
Studio.luaFunction('ic705Wpm', [
  'function ic705Wpm(wpm)',
  '  wpm = math.max(6, math.min(48, wpm))',
  '  return numberToBcd(math.floor((wpm - 6) * 255 / 42 + 0.5), 2)',
  'end'
], ['numberToBcd']);

// Converts -9999 ~ +9999 Hz into the RIT frequency data (command 21 00, p. 25)
Studio.luaFunction('ic705RitData', [
  'function ic705RitData(hz)',
  '  hz = math.floor(hz + 0.5)',
  '  local sign = 0',
  '  if hz < 0 then sign = 1; hz = -hz end',
  '  local t = frequencyToBcd(math.min(hz, 9999), 2)',
  '  table.insert(t, sign)',
  '  return t',
  'end'
], ['frequencyToBcd']);

// Reads the GPS position and time (command 23 00, p. 21 and 25). Returns nil if there is no answer yet.
Studio.luaFunction('ic705Gps', [
  'function ic705Gps()',
  '  local d = ic705Query({0x23}, {0x00})   -- d[1] is the sub command 00',
  '  if #d < 28 then return nil end',
  '  local function bcd(i, n)',
  '    local v = 0',
  '    for k = i, i + n - 1 do v = v * 100 + math.floor(d[k] / 16) * 10 + d[k] % 16 end',
  '    return v',
  '  end',
  '  local g = {}',
  '  g.lat = bcd(2, 1) + (bcd(3, 1) + bcd(4, 1) / 100 + math.floor(d[5] / 16) / 1000) / 60',
  '  if d[6] % 16 == 0 then g.lat = -g.lat end   -- 0 = south',
  '  g.lon = (d[7] % 16) * 100 + bcd(8, 1) + (bcd(9, 1) + bcd(10, 1) / 100 + math.floor(d[11] / 16) / 1000) / 60',
  '  if d[12] % 16 == 0 then g.lon = -g.lon end  -- 0 = west',
  '  g.alt = 0',
  '  if d[13] ~= 0xFF then                       -- FF = no altitude',
  '    g.alt = bcd(13, 3) / 10',
  '    if d[16] % 16 == 1 then g.alt = -g.alt end',
  '  end',
  '  g.course = bcd(17, 2)',
  '  g.speed = bcd(19, 3) / 10',
  '  g.year = bcd(22, 2)',
  '  g.month = bcd(24, 1)',
  '  g.day = bcd(25, 1)',
  '  g.hour = bcd(26, 1)',
  '  g.minute = bcd(27, 1)',
  '  g.second = bcd(28, 1)',
  '  return g',
  'end'
], ['ic705Query']);

// One value of the GPS position: lat, lon, alt, course or speed. 0 if there is no answer yet.
Studio.luaFunction('ic705GpsValue', [
  'function ic705GpsValue(name)',
  '  local g = ic705Gps()',
  '  if g == nil then return 0 end',
  '  return g[name]',
  'end'
], ['ic705Gps']);

// Seconds since 1970-01-01 00:00:00 UTC (the os library is not available on iCOMpadre)
Studio.luaFunction('ic705UnixTime', [
  'function ic705UnixTime(y, m, d, hour, minute, second)',
  '  if m <= 2 then y = y - 1; m = m + 12 end',
  '  local days = 365 * y + math.floor(y / 4) - math.floor(y / 100) + math.floor(y / 400)',
  '  days = days + math.floor((153 * (m - 3) + 2) / 5) + d - 719469',
  '  return days * 86400 + hour * 3600 + minute * 60 + second',
  'end'
]);

// One part of the GPS time (UTC): unix, text, year, month, day, hour, minute or second
Studio.luaFunction('ic705GpsTime', [
  'function ic705GpsTime(part)',
  '  local g = ic705Gps()',
  '  if g == nil then',
  '    if part == "text" then return "" end',
  '    return 0',
  '  end',
  '  if part == "unix" then return ic705UnixTime(g.year, g.month, g.day, g.hour, g.minute, g.second) end',
  '  if part == "text" then',
  '    return string.format("%04d-%02d-%02d %02d:%02d:%02d", g.year, g.month, g.day, g.hour, g.minute, g.second)',
  '  end',
  '  return g[part]',
  'end'
], ['ic705Gps', 'ic705UnixTime']);

// One part of the clock of the radio (local time, command 1A 05 0165 / 0166, p. 9):
// time, date, year, month, day, hour or minute
Studio.luaFunction('ic705Clock', [
  'function ic705Clock(part)',
  '  local d = ic705Query({0x1A, 0x05, 0x01, 0x65})',
  '  local t = ic705Query({0x1A, 0x05, 0x01, 0x66})',
  '  local function bcd(b) return math.floor(b / 16) * 10 + b % 16 end',
  '  local c = {year = 0, month = 0, day = 0, hour = 0, minute = 0}',
  '  if #d >= 4 then',
  '    c.year = bcd(d[1]) * 100 + bcd(d[2])',
  '    c.month = bcd(d[3])',
  '    c.day = bcd(d[4])',
  '  end',
  '  if #t >= 2 then',
  '    c.hour = bcd(t[1])',
  '    c.minute = bcd(t[2])',
  '  end',
  '  if part == "time" then return string.format("%02d:%02d", c.hour, c.minute) end',
  '  if part == "date" then return string.format("%04d-%02d-%02d", c.year, c.month, c.day) end',
  '  return c[part]',
  'end'
], ['ic705Query']);

// Maidenhead locator (6 characters) of a position, e.g. JN77rb
Studio.luaFunction('ic705Locator', [
  'function ic705Locator(lat, lon)',
  '  lon = lon + 180',
  '  lat = lat + 90',
  '  local A, a = string.byte("A"), string.byte("a")',
  '  return string.char(A + math.floor(lon / 20), A + math.floor(lat / 10))',
  '      .. math.floor((lon % 20) / 2) .. math.floor(lat % 10)',
  '      .. string.char(a + math.floor((lon % 2) * 12), a + math.floor((lat % 1) * 24))',
  'end'
]);

/* **************************************************************** */
/*                FREQUENCY & MODE                                  */
/* **************************************************************** */

// Sets the operating frequency.
// CI-V: 05 + 5 bytes BCD, least significant byte first (p. 16)
Blockly.Blocks['ic705_set_frequency'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Frequency to %1 %2",
      "args0": [
        {"type": "input_value", "name": "FREQUENCY", "check": "Number"},
        {"type": "field_dropdown", "name": "UNIT", "options": [["Hz", "1"], ["kHz", "1e3"], ["MHz", "1e6"]]}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the frequency of the radio"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_frequency'] = function(block) {
  var frequency = ic705Value(block, 'FREQUENCY', lua.Order.MULTIPLICATIVE);
  var unit = block.getFieldValue('UNIT');
  Studio.use(['frequencyToBcd']);
  return 'sendCommand({0x05}, frequencyToBcd(' + frequency + ' * ' + unit + ', 5))\n';
};

ic705Frequency.action("ic705_set_frequency");

//-------------------------------------------------------------------
// Sets the operating mode (with the default filter of the mode).
// CI-V: 06 + mode (p. 16)
Blockly.Blocks['ic705_set_operating_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Operating Mode to %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                      ["FM", "0x05"], ["WFM", "0x06"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["DV", "0x17"]]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the operating mode of the radio"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_operating_mode'] = function(block) {
  return 'sendCommand({0x06}, {' + block.getFieldValue('MODE') + '})\n';
};

ic705Frequency.action("ic705_set_operating_mode");

//-------------------------------------------------------------------
// Switches the data mode (e.g. USB-D for FT8) on or off.
// CI-V: 1A 06 + 01 01 (on, FIL1) / 00 00 (off) (p. 21)
Blockly.Blocks['ic705_set_data_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Data Mode %1",
      "args0": [
        {"type": "field_dropdown", "name": "STATE", "options": [["on", "{0x01, 0x01}"], ["off", "{0x00, 0x00}"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the data mode (e.g. USB-D for digital modes like FT8) on or off"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_data_mode'] = function(block) {
  return 'sendCommand({0x1A, 0x06}, ' + block.getFieldValue('STATE') + ')\n';
};

ic705Frequency.action("ic705_set_data_mode");

//-------------------------------------------------------------------
// Sets the tuning step.
// CI-V: 10 + 00 ~ 13 (p. 3)
Blockly.Blocks['ic705_set_tuning_step'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Tuning Step to %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "STEP",
          "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["500Hz", "0x02"], ["1kHz", "0x03"],
                      ["5kHz", "0x04"], ["6.25kHz", "0x05"], ["8.33kHz", "0x06"], ["9kHz", "0x07"], ["10kHz", "0x08"],
                      ["12.5kHz", "0x09"], ["20kHz", "0x10"], ["25kHz", "0x11"], ["50kHz", "0x12"], ["100kHz", "0x13"]]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the tuning step of the radio"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_tuning_step'] = function(block) {
  return 'sendCommand({0x10, ' + block.getFieldValue('STEP') + '})\n';
};

ic705Frequency.action("ic705_set_tuning_step");

//-------------------------------------------------------------------
// CI-V: 07 00 (p. 3)
Blockly.Blocks['ic705_select_vfo_a'] = {
  init: function() {
    this.jsonInit({
      "message0": "Select VFO A",
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Selects VFO A"
    });
  }
};

Blockly.Lua.forBlock['ic705_select_vfo_a'] = function(block) {
  return 'sendCommand({0x07, 0x00})\n';
};

ic705Frequency.action("ic705_select_vfo_a");

//-------------------------------------------------------------------
// CI-V: 07 01 (p. 3)
Blockly.Blocks['ic705_select_vfo_b'] = {
  init: function() {
    this.jsonInit({
      "message0": "Select VFO B",
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Selects VFO B"
    });
  }
};

Blockly.Lua.forBlock['ic705_select_vfo_b'] = function(block) {
  return 'sendCommand({0x07, 0x01})\n';
};

ic705Frequency.action("ic705_select_vfo_b");

//-------------------------------------------------------------------
// CI-V: 07 A0 (p. 3)
Blockly.Blocks['ic705_equalize_vfo'] = {
  init: function() {
    this.jsonInit({
      "message0": "Equalize VFO A and VFO B",
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Copies the frequency and mode of the selected VFO to the other one"
    });
  }
};

Blockly.Lua.forBlock['ic705_equalize_vfo'] = function(block) {
  return 'sendCommand({0x07, 0xA0})\n';
};

ic705Frequency.action("ic705_equalize_vfo");

//-------------------------------------------------------------------
// CI-V: 07 B0 (p. 3)
Blockly.Blocks['ic705_exchange_vfo'] = {
  init: function() {
    this.jsonInit({
      "message0": "Exchange VFO A and VFO B",
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Exchanges the frequency and mode of VFO A and VFO B"
    });
  }
};

Blockly.Lua.forBlock['ic705_exchange_vfo'] = function(block) {
  return 'sendCommand({0x07, 0xB0})\n';
};

ic705Frequency.action("ic705_exchange_vfo");

//-------------------------------------------------------------------
// Split and duplex.
// CI-V: 0F + 00 (split off) / 01 (split on) / 10 (simplex) / 11 (DUP-) / 12 (DUP+) (p. 3)
Blockly.Blocks['ic705_set_split'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "SPLIT",
          "options": [["Split on", "0x01"], ["Split off", "0x00"], ["Simplex", "0x10"], ["Duplex -", "0x11"], ["Duplex +", "0x12"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the split function, or selects simplex or duplex operation"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_split'] = function(block) {
  return 'sendCommand({0x0F, ' + block.getFieldValue('SPLIT') + '})\n';
};

ic705Frequency.action("ic705_set_split");

//-------------------------------------------------------------------
// Switches to the memory mode and selects a memory channel.
// CI-V: 08 (memory mode), 08 + 0000 ~ 0099 (channel) (p. 3)
Blockly.Blocks['ic705_select_memory'] = {
  init: function() {
    this.jsonInit({
      "message0": "Select Memory Channel %1",
      "args0": [
        {"type": "input_value", "name": "CHANNEL", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches to the memory mode and selects the memory channel (0 ~ 99)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'CHANNEL', 0, 99, "The memory channel must be between 0 and 99");
  }
};

Blockly.Lua.forBlock['ic705_select_memory'] = function(block) {
  Studio.use(['numberToBcd']);
  return 'sendCommand({0x08})\n' +
         'sendCommand({0x08}, numberToBcd(' + ic705Value(block, 'CHANNEL') + ', 2))\n';
};

ic705Frequency.action("ic705_select_memory");

//-------------------------------------------------------------------
// CI-V: 21 01 + 00/01 (p. 14)
Blockly.Blocks['ic705_set_rit'] = {
  init: function() {
    this.jsonInit({
      "message0": "RIT %1",
      "args0": [
        {"type": "field_dropdown", "name": "STATE", "options": IC705_ON_OFF}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the RIT (receive incremental tuning) on or off"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_rit'] = function(block) {
  return 'sendCommand({0x21, 0x01}, {' + block.getFieldValue('STATE') + '})\n';
};

ic705Frequency.action("ic705_set_rit");

//-------------------------------------------------------------------
// CI-V: 21 00 + 10Hz/1Hz, 1kHz/100Hz, direction (p. 25)
Blockly.Blocks['ic705_set_rit_offset'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set RIT offset to %1 Hz",
      "args0": [
        {"type": "input_value", "name": "OFFSET", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the RIT offset (-9999 ~ +9999 Hz)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'OFFSET', -9999, 9999, "The RIT offset must be between -9999 and +9999 Hz");
  }
};

Blockly.Lua.forBlock['ic705_set_rit_offset'] = function(block) {
  Studio.use(['ic705RitData']);
  return 'sendCommand({0x21, 0x00}, ic705RitData(' + ic705Value(block, 'OFFSET') + '))\n';
};

ic705Frequency.action("ic705_set_rit_offset");

//-------------------------------------------------------------------
// CI-V: 0E + 00 (stop) / 01 ~ 24 (scan type) (p. 3)
Blockly.Blocks['ic705_scan'] = {
  init: function() {
    this.jsonInit({
      "message0": "Scan %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "SCAN",
          "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                      ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"],
                      ["select memory", "0x23"], ["mode select", "0x24"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Starts a scan of the selected type, or stops it"
    });
  }
};

Blockly.Lua.forBlock['ic705_scan'] = function(block) {
  return 'sendCommand({0x0E, ' + block.getFieldValue('SCAN') + '})\n';
};

ic705Frequency.action("ic705_scan");

//-------------------------------------------------------------------
// Reads the operating frequency.
// CI-V: 03 (p. 16)
Blockly.Blocks['ic705_get_operating_frequency'] = {
  init: function() {
    this.jsonInit({
      "message0": "operating frequency in %1",
      "args0": [
        {"type": "field_dropdown", "name": "unit", "options": [["Hz", "1"], ["kHz", "1e3"], ["MHz", "1e6"]]}
      ],
      "output": "Number",
      "tooltip": "Reads the current frequency of the radio"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_operating_frequency'] = function(block) {
  Studio.use(['ic705ReadFrequency']);
  var unit = block.getFieldValue('unit');
  if (unit == "1")
  {
    return ['ic705ReadFrequency()', lua.Order.HIGH];
  }
  return ['ic705ReadFrequency() / ' + unit, lua.Order.MULTIPLICATIVE];
};

ic705Frequency.property("ic705_get_operating_frequency");

//-------------------------------------------------------------------
// Reads the operating mode as text (LSB, USB, ...).
// CI-V: 04 (p. 16)
Blockly.Blocks['ic705_get_operating_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Operating Mode",
      "output": "String",
      "tooltip": "Reads the current operating mode of the radio (LSB, USB, AM, CW, RTTY, FM, WFM, CW-R, RTTY-R or DV)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_operating_mode'] = function(block) {
  Studio.use(['getOperatingModeString', 'ic705Query']);
  return ['getOperatingModeString(ic705Query({0x04}))', lua.Order.HIGH];
};

ic705Frequency.property("ic705_get_operating_mode");

//-------------------------------------------------------------------
// CI-V: 1A 06 -> 00/01 + filter (p. 21)
Blockly.Blocks['ic705_is_data_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Data Mode on?",
      "output": "Boolean",
      "tooltip": "True if the data mode (e.g. USB-D) is on"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_data_mode'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x1A, 0x06})', lua.Order.HIGH];
};

ic705Frequency.property("ic705_is_data_mode");

//-------------------------------------------------------------------
// CI-V: 0F -> 00 (split off) / 01 (split on) / 10, 11, 12 (simplex, duplex) (p. 3)
Blockly.Blocks['ic705_is_split'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Split on?",
      "output": "Boolean",
      "tooltip": "True if the split function is on"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_split'] = function(block) {
  Studio.use(['ic705ReadByte']);
  return ['ic705ReadByte({0x0F}) == 1', lua.Order.RELATIONAL];
};

ic705Frequency.property("ic705_is_split");

/* **************************************************************** */
/*                RECEIVER                                          */
/* **************************************************************** */

// CI-V: 14 01 + 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_set_af_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set AF Level to %1 %%",
      "args0": [
        {"type": "input_value", "name": "level", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the AF output level (volume) in %"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'level', 0, 100, "AF level must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_af_level'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x01}, ic705Percent(' + ic705Value(block, 'level') + '))\n';
};

ic705Receiver.action("ic705_set_af_level");

//-------------------------------------------------------------------
// CI-V: 14 02 + 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_set_rf_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set RF Gain to %1 %%",
      "args0": [
        {"type": "input_value", "name": "gain", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the RF gain in %"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'gain', 0, 100, "RF gain must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_rf_gain'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x02}, ic705Percent(' + ic705Value(block, 'gain') + '))\n';
};

ic705Receiver.action("ic705_set_rf_gain");

//-------------------------------------------------------------------
// CI-V: 14 03 + 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_set_squelch_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Squelch Level to %1 %%",
      "args0": [
        {"type": "input_value", "name": "level", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the squelch level in %"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'level', 0, 100, "Squelch level must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_squelch_level'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x03}, ic705Percent(' + ic705Value(block, 'level') + '))\n';
};

ic705Receiver.action("ic705_set_squelch_level");

//-------------------------------------------------------------------
// CI-V: 16 02 + 00 (off) / 01 (P.AMP1) / 02 (P.AMP2) (p. 4)
Blockly.Blocks['ic705_set_preamp'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Preamp to %1",
      "args0": [
        {"type": "field_dropdown", "name": "PREAMP", "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the preamplifier. On 144 and 430 MHz there is only one preamp (P.AMP1 = on)"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_preamp'] = function(block) {
  return 'sendCommand({0x16, 0x02}, {' + block.getFieldValue('PREAMP') + '})\n';
};

ic705Receiver.action("ic705_set_preamp");

//-------------------------------------------------------------------
// CI-V: 11 + 00 (off) / 20 (20 dB) (p. 3)
Blockly.Blocks['ic705_set_attenuator'] = {
  init: function() {
    this.jsonInit({
      "message0": "Attenuator %1",
      "args0": [
        {"type": "field_dropdown", "name": "STATE", "options": [["on", "0x20"], ["off", "0x00"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the 20 dB attenuator on or off (HF and 50 MHz bands only)"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_attenuator'] = function(block) {
  return 'sendCommand({0x11, ' + block.getFieldValue('STATE') + '})\n';
};

ic705Receiver.action("ic705_set_attenuator");

//-------------------------------------------------------------------
// CI-V: 16 12 + 01 (FAST) / 02 (MID) / 03 (SLOW) (p. 4)
Blockly.Blocks['ic705_set_agc'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set AGC to %1",
      "args0": [
        {"type": "field_dropdown", "name": "AGC", "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the AGC time constant"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_agc'] = function(block) {
  return 'sendCommand({0x16, 0x12}, {' + block.getFieldValue('AGC') + '})\n';
};

ic705Receiver.action("ic705_set_agc");

//-------------------------------------------------------------------
// CI-V: 14 01 -> 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_get_af_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "AF Level",
      "output": "Number",
      "tooltip": "Reads the current AF level of the radio (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_af_level'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x01})', lua.Order.HIGH];
};

ic705Receiver.property("ic705_get_af_level");

//-------------------------------------------------------------------
// CI-V: 14 02 -> 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_get_rf_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "RF Gain",
      "output": "Number",
      "tooltip": "Reads the current RF gain level of the radio (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_rf_gain'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x02})', lua.Order.HIGH];
};

ic705Receiver.property("ic705_get_rf_gain");

//-------------------------------------------------------------------
// CI-V: 14 03 -> 0000 ~ 0255 (p. 3)
Blockly.Blocks['ic705_get_squelch_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Squelch Level",
      "output": "Number",
      "tooltip": "Reads the current squelch level of the radio (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_squelch_level'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x03})', lua.Order.HIGH];
};

ic705Receiver.property("ic705_get_squelch_level");

//-------------------------------------------------------------------
// CI-V: 16 02 -> 00 / 01 / 02 (p. 4)
Blockly.Blocks['ic705_get_preamp'] = {
  init: function() {
    this.jsonInit({
      "message0": "Preamp",
      "output": "String",
      "tooltip": "Reads the preamplifier setting: OFF, P.AMP1 or P.AMP2"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_preamp'] = function(block) {
  Studio.use(['ic705ReadByte']);
  return ['({[0] = "OFF", [1] = "P.AMP1", [2] = "P.AMP2"})[ic705ReadByte({0x16, 0x02})] or "OFF"', lua.Order.OR];
};

ic705Receiver.property("ic705_get_preamp");

//-------------------------------------------------------------------
// CI-V: 11 -> 00 (off) / 20 (on) (p. 3)
Blockly.Blocks['ic705_is_attenuator_on'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Attenuator on?",
      "output": "Boolean",
      "tooltip": "True if the 20 dB attenuator is on"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_attenuator_on'] = function(block) {
  Studio.use(['ic705ReadByte']);
  return ['ic705ReadByte({0x11}) == 0x20', lua.Order.RELATIONAL];
};

ic705Receiver.property("ic705_is_attenuator_on");

//-------------------------------------------------------------------
// CI-V: 16 12 -> 01 / 02 / 03 (p. 4)
Blockly.Blocks['ic705_get_agc'] = {
  init: function() {
    this.jsonInit({
      "message0": "AGC",
      "output": "String",
      "tooltip": "Reads the AGC time constant: FAST, MID or SLOW"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_agc'] = function(block) {
  Studio.use(['ic705ReadByte']);
  return ['({"FAST", "MID", "SLOW"})[ic705ReadByte({0x16, 0x12})] or ""', lua.Order.OR];
};

ic705Receiver.property("ic705_get_agc");

//-------------------------------------------------------------------
// CI-V: 15 01 -> 00 (closed) / 01 (open) (p. 4)
Blockly.Blocks['ic705_is_squelch_open'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Squelch open?",
      "output": "Boolean",
      "tooltip": "True if the squelch is open, i.e. a signal is received"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_squelch_open'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x15, 0x01})', lua.Order.HIGH];
};

ic705Receiver.property("ic705_is_squelch_open");

/* **************************************************************** */
/*                TRANSMIT                                          */
/* **************************************************************** */

// Switches between transmit and receive (PTT).
// CI-V: 1C 00 + 00 (RX) / 01 (TX) (p. 14)
Blockly.Blocks['ic705_set_transmit'] = {
  init: function() {
    this.jsonInit({
      "message0": "Transmit %1",
      "args0": [
        {"type": "field_dropdown", "name": "STATE", "options": [["on (TX)", "0x01"], ["off (RX)", "0x00"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the transmitter on (like pressing PTT) or back to receive. Make sure your program switches it off again!"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_transmit'] = function(block) {
  return 'sendCommand({0x1C, 0x00}, {' + block.getFieldValue('STATE') + '})\n';
};

ic705Transmit.action("ic705_set_transmit");

//-------------------------------------------------------------------
// CI-V: 14 0A + 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_set_rf_power'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set RF Power to %1 %%",
      "args0": [
        {"type": "input_value", "name": "POWER", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the RF power of the selected band in % of the maximum"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'POWER', 0, 100, "RF power must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_rf_power'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x0A}, ic705Percent(' + ic705Value(block, 'POWER') + '))\n';
};

ic705Transmit.action("ic705_set_rf_power");

//-------------------------------------------------------------------
// CI-V: 14 0B + 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_set_mic_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Mic Gain to %1 %%",
      "args0": [
        {"type": "input_value", "name": "LEVEL", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the mic gain level of the radio (in %)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'LEVEL', 0, 100, "Mic gain must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_mic_gain'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x0B}, ic705Percent(' + ic705Value(block, 'LEVEL') + '))\n';
};

ic705Transmit.action("ic705_set_mic_gain");

//-------------------------------------------------------------------
// Repeater tone frequency.
// CI-V: 1B 00 + 3 bytes BCD in 0.1 Hz (p. 21)
Blockly.Blocks['ic705_set_tone_frequency'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Repeater Tone to %1 Hz",
      "args0": [
        {"type": "input_value", "name": "TONE", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the frequency of the repeater tone (CTCSS), e.g. 88.5 Hz"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'TONE', 67, 254.1, "The repeater tone must be between 67.0 and 254.1 Hz");
  }
};

Blockly.Lua.forBlock['ic705_set_tone_frequency'] = function(block) {
  Studio.use(['numberToBcd']);
  return 'sendCommand({0x1B, 0x00}, numberToBcd(math.floor(' + ic705Value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
};

ic705Transmit.action("ic705_set_tone_frequency");

//-------------------------------------------------------------------
// CI-V: 1C 00 -> 00 (RX) / 01 (TX) (p. 14)
Blockly.Blocks['ic705_is_transmitting'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Transmitting?",
      "output": "Boolean",
      "tooltip": "True while the radio transmits"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_transmitting'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x1C, 0x00})', lua.Order.HIGH];
};

ic705Transmit.property("ic705_is_transmitting");

//-------------------------------------------------------------------
// CI-V: 14 0A -> 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_get_rf_power'] = {
  init: function() {
    this.jsonInit({
      "message0": "RF Power",
      "output": "Number",
      "tooltip": "Reads the RF power setting of the selected band (in % of the maximum)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_rf_power'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x0A})', lua.Order.HIGH];
};

ic705Transmit.property("ic705_get_rf_power");

//-------------------------------------------------------------------
// CI-V: 14 0B -> 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_get_mic_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "Mic Gain",
      "output": "Number",
      "tooltip": "Reads the current mic gain level of the radio (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_mic_gain'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x0B})', lua.Order.HIGH];
};

ic705Transmit.property("ic705_get_mic_gain");

/* **************************************************************** */
/*                METERS                                            */
/* **************************************************************** */

// CI-V: 15 02 -> 0000 = S0, 0120 = S9, 0241 = S9+60 dB (p. 4)
Blockly.Blocks['ic705_get_s_meter'] = {
  init: function() {
    this.jsonInit({
      "message0": "S-Meter in %1",
      "args0": [
        {"type": "field_dropdown", "name": "UNIT", "options": [["S-units", "S"], ["dB over S9", "DB"]]}
      ],
      "output": "Number",
      "tooltip": "Reads the S-meter: in S-units (0 ~ 9), or in dB over S9 (negative below S9, 6 dB per S-unit)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_s_meter'] = function(block) {
  Studio.use(['ic705Meter']);
  if (block.getFieldValue('UNIT') == 'DB')
  {
    return ['ic705Meter({0x15, 0x02}, {{0, -54}, {120, 0}, {241, 60}})', lua.Order.HIGH];
  }
  return ['math.min(9, ic705Meter({0x15, 0x02}, {{0, 0}, {120, 9}}))', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_s_meter");

//-------------------------------------------------------------------
// CI-V: 15 12 -> 0000 = SWR 1.0, 0048 = 1.5, 0080 = 2.0, 0120 = 3.0 (p. 4)
Blockly.Blocks['ic705_get_swr_meter_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "SWR",
      "output": "Number",
      "tooltip": "Reads the SWR while transmitting, e.g. 1.5"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_swr_meter_level'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x12}, {{0, 1.0}, {48, 1.5}, {80, 2.0}, {120, 3.0}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_swr_meter_level");

//-------------------------------------------------------------------
// CI-V: 15 11 -> 0000 = 0 %, 0143 = 50 %, 0213 = 100 % (p. 4)
Blockly.Blocks['ic705_get_power_output'] = {
  init: function() {
    this.jsonInit({
      "message0": "Power Output",
      "output": "Number",
      "tooltip": "Reads the output power meter while transmitting (in % of the maximum)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_power_output'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x11}, {{0, 0}, {143, 50}, {213, 100}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_power_output");

//-------------------------------------------------------------------
// CI-V: 15 13 -> 0000 = minimum ~ 0120 = maximum (p. 4)
Blockly.Blocks['ic705_get_alc'] = {
  init: function() {
    this.jsonInit({
      "message0": "ALC",
      "output": "Number",
      "tooltip": "Reads the ALC meter while transmitting (in %, 100 = end of the ALC zone)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_alc'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x13}, {{0, 0}, {120, 100}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_alc");

//-------------------------------------------------------------------
// CI-V: 15 15 -> 0000 = 0 V, 0075 = 5 V, 0241 = 16 V (p. 4)
Blockly.Blocks['ic705_get_supply_voltage'] = {
  init: function() {
    this.jsonInit({
      "message0": "Supply Voltage",
      "output": "Number",
      "tooltip": "Reads the supply voltage of the radio (in V), e.g. to watch the battery"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_supply_voltage'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x15}, {{0, 0}, {75, 5}, {241, 16}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_supply_voltage");

//-------------------------------------------------------------------
// CI-V: 15 16 -> 0000 = 0 A, 0121 = 2 A, 0241 = 4 A (p. 4)
Blockly.Blocks['ic705_get_supply_current'] = {
  init: function() {
    this.jsonInit({
      "message0": "Supply Current",
      "output": "Number",
      "tooltip": "Reads the current drawn by the radio (in A)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_supply_current'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x16}, {{0, 0}, {121, 2}, {241, 4}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_supply_current");

//-------------------------------------------------------------------
// CI-V: 1A 0B -> 00 (external power supply) / 01 (battery pack) (p. 14)
Blockly.Blocks['ic705_is_on_battery'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is on Battery?",
      "output": "Boolean",
      "tooltip": "True if the radio is powered by its battery pack, false with an external power supply"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_on_battery'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x1A, 0x0B})', lua.Order.HIGH];
};

ic705Meters.property("ic705_is_on_battery");

/* **************************************************************** */
/*                CW & VOICE                                        */
/* **************************************************************** */

// Sends a text as CW (up to 30 characters).
// CI-V: 17 + ASCII codes (p. 16)
Blockly.Blocks['ic705_send_cw'] = {
  init: function() {
    this.jsonInit({
      "message0": "Send CW %1",
      "args0": [
        {"type": "input_value", "name": "TEXT"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sends the text (up to 30 characters) as CW. The radio has to be in CW mode with break-in on"
    });
  }
};

Blockly.Lua.forBlock['ic705_send_cw'] = function(block) {
  Studio.use(['ic705TextBytes']);
  var text = Blockly.Lua.valueToCode(block, 'TEXT', lua.Order.NONE) || "''";
  return 'sendCommand({0x17}, ic705TextBytes(' + text + '))\n';
};

ic705CwVoice.action("ic705_send_cw");

//-------------------------------------------------------------------
// CI-V: 14 0C + 0000 = 6 WPM ~ 0255 = 48 WPM (p. 4)
Blockly.Blocks['ic705_set_keying_speed'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set CW Speed to %1 WPM",
      "args0": [
        {"type": "input_value", "name": "WPM", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the keying speed of the electronic keyer (6 ~ 48 WPM)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'WPM', 6, 48, "The CW speed must be between 6 and 48 WPM");
  }
};

Blockly.Lua.forBlock['ic705_set_keying_speed'] = function(block) {
  Studio.use(['ic705Wpm']);
  return 'sendCommand({0x14, 0x0C}, ic705Wpm(' + ic705Value(block, 'WPM') + '))\n';
};

ic705CwVoice.action("ic705_set_keying_speed");

//-------------------------------------------------------------------
// CI-V: 28 00 + 01 ~ 08 (T1 ~ T8) / 00 (stop) (p. 15)
Blockly.Blocks['ic705_play_voice_memory'] = {
  init: function() {
    this.jsonInit({
      "message0": "Transmit Voice Memory %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MEMORY",
          "options": [["T1", "0x01"], ["T2", "0x02"], ["T3", "0x03"], ["T4", "0x04"], ["T5", "0x05"],
                      ["T6", "0x06"], ["T7", "0x07"], ["T8", "0x08"], ["stop", "0x00"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Transmits a recorded voice memory (e.g. a CQ call), or stops it"
    });
  }
};

Blockly.Lua.forBlock['ic705_play_voice_memory'] = function(block) {
  return 'sendCommand({0x28, 0x00}, {' + block.getFieldValue('MEMORY') + '})\n';
};

ic705CwVoice.action("ic705_play_voice_memory");

//-------------------------------------------------------------------
// CI-V: 13 00 / 01 / 02 (p. 3)
Blockly.Blocks['ic705_announce'] = {
  init: function() {
    this.jsonInit({
      "message0": "Announce %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "WHAT",
          "options": [["frequency, S-meter and mode", "0x00"], ["frequency and S-meter", "0x01"], ["mode", "0x02"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "The radio speaks the selected information with its voice synthesizer"
    });
  }
};

Blockly.Lua.forBlock['ic705_announce'] = function(block) {
  return 'sendCommand({0x13, ' + block.getFieldValue('WHAT') + '})\n';
};

ic705CwVoice.action("ic705_announce");

//-------------------------------------------------------------------
// CI-V: 14 0C -> 0000 = 6 WPM ~ 0255 = 48 WPM (p. 4)
Blockly.Blocks['ic705_get_keying_speed'] = {
  init: function() {
    this.jsonInit({
      "message0": "CW Speed",
      "output": "Number",
      "tooltip": "Reads the keying speed of the electronic keyer (in WPM)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_keying_speed'] = function(block) {
  Studio.use(['ic705ReadNumber']);
  return ['math.floor(6 + ic705ReadNumber({0x14, 0x0C}) * 42 / 255 + 0.5)', lua.Order.HIGH];
};

ic705CwVoice.property("ic705_get_keying_speed");

/* **************************************************************** */
/*                GPS & TIME                                        */
/* **************************************************************** */

// CI-V: 23 00 (p. 21 and 25)
Blockly.Blocks['ic705_get_gps_position'] = {
  init: function() {
    this.jsonInit({
      "message0": "GPS %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "VALUE",
          "options": [["latitude", "lat"], ["longitude", "lon"], ["altitude (m)", "alt"], ["course (°)", "course"], ["speed (km/h)", "speed"]]
        }
      ],
      "output": "Number",
      "tooltip": "Reads the position of the internal GPS. Latitude and longitude in degrees (north and east positive)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_gps_position'] = function(block) {
  Studio.use(['ic705GpsValue']);
  return ['ic705GpsValue("' + block.getFieldValue('VALUE') + '")', lua.Order.HIGH];
};

ic705Gps.property("ic705_get_gps_position");

//-------------------------------------------------------------------
// CI-V: 23 00, date and time in UTC (p. 25)
Blockly.Blocks['ic705_get_gps_time'] = {
  init: function() {
    this.jsonInit({
      "message0": "GPS Time (UTC) %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PART",
          "options": [["as text", "text"], ["unix time", "unix"], ["year", "year"], ["month", "month"], ["day", "day"],
                      ["hour", "hour"], ["minute", "minute"], ["second", "second"]]
        }
      ],
      "output": null,
      "tooltip": "Reads the date and time (UTC) of the internal GPS. Unix time are the seconds since 1970-01-01"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_gps_time'] = function(block) {
  Studio.use(['ic705GpsTime']);
  return ['ic705GpsTime("' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
};

ic705Gps.property("ic705_get_gps_time");

//-------------------------------------------------------------------
// CI-V: 1A 05 0165 (date) and 1A 05 0166 (time) (p. 9)
Blockly.Blocks['ic705_get_clock'] = {
  init: function() {
    this.jsonInit({
      "message0": "Radio Clock %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PART",
          "options": [["time as text", "time"], ["date as text", "date"], ["year", "year"], ["month", "month"],
                      ["day", "day"], ["hour", "hour"], ["minute", "minute"]]
        }
      ],
      "output": null,
      "tooltip": "Reads the date and time of the clock of the radio (local time)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_clock'] = function(block) {
  Studio.use(['ic705Clock']);
  return ['ic705Clock("' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
};

ic705Gps.property("ic705_get_clock");

//-------------------------------------------------------------------
// Maidenhead locator of a position (no CI-V command)
Blockly.Blocks['ic705_locator'] = {
  init: function() {
    this.jsonInit({
      "message0": "Locator of latitude %1 longitude %2",
      "args0": [
        {"type": "input_value", "name": "LAT", "check": "Number"},
        {"type": "input_value", "name": "LON", "check": "Number"}
      ],
      "inputsInline": true,
      "output": "String",
      "tooltip": "Calculates the Maidenhead locator (6 characters, e.g. JN77rb) of a position"
    });
  }
};

Blockly.Lua.forBlock['ic705_locator'] = function(block) {
  Studio.use(['ic705Locator']);
  return ['ic705Locator(' + ic705Value(block, 'LAT') + ', ' + ic705Value(block, 'LON') + ')', lua.Order.HIGH];
};

ic705Gps.helper("ic705_locator");

/* **************************************************************** */
/*                SETTINGS                                          */
/* **************************************************************** */

// Functions which can be switched on and off with command 16 (p. 4)
var IC705_FUNCTIONS = [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                       ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                       ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["DTCS", "0x4B"], ["Twin Peak Filter", "0x4F"],
                       ["Dial Lock", "0x50"]];

// CI-V: 16 xx + 00 (off) / 01 (on) (p. 4)
Blockly.Blocks['ic705_switch_function'] = {
  init: function() {
    this.jsonInit({
      "message0": "Switch %1 %2",
      "args0": [
        {"type": "field_dropdown", "name": "FUNCTION", "options": IC705_FUNCTIONS},
        {"type": "field_dropdown", "name": "STATE", "options": IC705_ON_OFF}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches a function of the radio on or off"
    });
  }
};

Blockly.Lua.forBlock['ic705_switch_function'] = function(block) {
  return 'sendCommand({0x16, ' + block.getFieldValue('FUNCTION') + '}, {' + block.getFieldValue('STATE') + '})\n';
};

ic705Settings.action("ic705_switch_function");

//-------------------------------------------------------------------
// CI-V: 14 19 + 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_set_lcd_brightness'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set LCD Brightness to %1 %%",
      "args0": [
        {"type": "input_value", "name": "LEVEL", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the LCD brightness level of the radio (in %)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'LEVEL', 0, 100, "LCD brightness must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_lcd_brightness'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, 0x19}, ic705Percent(' + ic705Value(block, 'LEVEL') + '))\n';
};

ic705Settings.action("ic705_set_lcd_brightness");

//-------------------------------------------------------------------
// CI-V: 18 00 (off) / 18 01 (on) (p. 4)
Blockly.Blocks['ic705_set_power'] = {
  init: function() {
    this.jsonInit({
      "message0": "Switch Radio %1",
      "args0": [
        {"type": "field_dropdown", "name": "STATE", "options": [["off", "0x00"], ["on", "0x01"]]}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Switches the radio off or on. Switching on only works if the radio is in standby"
    });
  }
};

Blockly.Lua.forBlock['ic705_set_power'] = function(block) {
  return 'sendCommand({0x18, ' + block.getFieldValue('STATE') + '})\n';
};

ic705Settings.action("ic705_set_power");

//-------------------------------------------------------------------
// CI-V: 16 xx -> 00 (off) / 01 (on) (p. 4)
Blockly.Blocks['ic705_is_function_on'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is %1 on?",
      "args0": [
        {"type": "field_dropdown", "name": "FUNCTION", "options": IC705_FUNCTIONS}
      ],
      "output": "Boolean",
      "tooltip": "True if the function of the radio is switched on"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_function_on'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x16, ' + block.getFieldValue('FUNCTION') + '})', lua.Order.HIGH];
};

ic705Settings.property("ic705_is_function_on");

//-------------------------------------------------------------------
// CI-V: 14 19 -> 0000 ~ 0255 (p. 4)
Blockly.Blocks['ic705_get_lcd_brightness'] = {
  init: function() {
    this.jsonInit({
      "message0": "LCD Brightness",
      "output": "Number",
      "tooltip": "Reads the current LCD brightness level of the radio (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_lcd_brightness'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, 0x19})', lua.Order.HIGH];
};

ic705Settings.property("ic705_get_lcd_brightness");

/* **************************************************************** */
/*                MORE SETTINGS                                     */
/* **************************************************************** */
// Levels and settings which are used less often. Settings of the menu which have no own block
// can be changed with the blocks "Set Menu Setting" and "Menu Setting".

// Converts a value between min and max into the 2 byte BCD level 0000 ~ 0255
Studio.luaFunction('ic705Level', [
  'function ic705Level(value, min, max)',
  '  value = math.max(min, math.min(max, value))',
  '  return numberToBcd(math.floor((value - min) * 255 / (max - min) + 0.5), 2)',
  'end'
], ['numberToBcd']);

// Reads a level 0000 ~ 0255 and converts it into a value between min and max, rounded to 0.1
Studio.luaFunction('ic705ReadLevel', [
  'function ic705ReadLevel(cmd, min, max)',
  '  return math.floor((min + ic705ReadNumber(cmd) * (max - min) / 255) * 10 + 0.5) / 10',
  'end'
], ['ic705ReadNumber']);

// Name of the first byte of the answer, "" if there is no answer yet. names maps the byte to the name.
Studio.luaFunction('ic705ReadName', [
  'function ic705ReadName(cmd, names)',
  '  local d = ic705Query(cmd)',
  '  if d[1] == nil then return "" end',
  '  return names[d[1]] or ""',
  'end'
], ['ic705Query']);

// Data of the DTCS code (e.g. 23 for code 023) and the polarity (command 1B 02, p. 21)
Studio.luaFunction('ic705DtcsData', [
  'function ic705DtcsData(code, polarity)',
  '  local s = string.format("%03d", math.max(0, math.min(777, math.floor(code))))',
  '  return {polarity, tonumber(s:sub(1, 1)), tonumber(s:sub(2, 2)) * 16 + tonumber(s:sub(3, 3))}',
  'end'
]);

// Reads the DTCS code (e.g. 23 for code 023), 0 if there is no answer yet
Studio.luaFunction('ic705ReadDtcs', [
  'function ic705ReadDtcs()',
  '  local d = ic705Query({0x1B, 0x02})',
  '  if #d < 3 then return 0 end',
  '  return (d[2] % 16) * 100 + math.floor(d[3] / 16) * 10 + d[3] % 16',
  'end'
], ['ic705Query']);

// The command of a menu setting: 1A 05 + the number of the setting as 2 bytes BCD, e.g. 0029
Studio.luaFunction('ic705MenuCmd', [
  'function ic705MenuCmd(item)',
  '  local b = numberToBcd(item, 2)',
  '  return {0x1A, 0x05, b[1], b[2]}',
  'end'
], ['numberToBcd']);

// Levels 0 ~ 100 % of command 14 (p. 3 and 4)
var IC705_LEVELS = [["NR level", "0x06"], ["NB level", "0x12"], ["inner PBT (PBT1)", "0x07"], ["outer PBT (PBT2)", "0x08"],
                    ["manual notch position", "0x0D"], ["monitor level", "0x15"], ["VOX gain", "0x16"], ["anti-VOX gain", "0x17"]];

// CI-V: 14 xx + 0000 ~ 0255 (p. 3 and 4)
Blockly.Blocks['ic705_set_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set %1 to %2 %%",
      "args0": [
        {"type": "field_dropdown", "name": "LEVEL", "options": IC705_LEVELS},
        {"type": "input_value", "name": "VALUE", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets a level in %. For the PBT and the notch position 50 % is the center"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'VALUE', 0, 100, "The level must be between 0 and 100%");
  }
};

Blockly.Lua.forBlock['ic705_set_level'] = function(block) {
  Studio.use(['ic705Percent']);
  return 'sendCommand({0x14, ' + block.getFieldValue('LEVEL') + '}, ic705Percent(' + ic705Value(block, 'VALUE') + '))\n';
};

ic705Settings.action("ic705_set_level");

//-------------------------------------------------------------------
// CI-V: 14 xx -> 0000 ~ 0255 (p. 3 and 4)
Blockly.Blocks['ic705_get_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "%1",
      "args0": [
        {"type": "field_dropdown", "name": "LEVEL", "options": IC705_LEVELS}
      ],
      "output": "Number",
      "tooltip": "Reads a level (in %)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_level'] = function(block) {
  Studio.use(['ic705ReadPercent']);
  return ['ic705ReadPercent({0x14, ' + block.getFieldValue('LEVEL') + '})', lua.Order.HIGH];
};

ic705Settings.property("ic705_get_level");

//-------------------------------------------------------------------
// A setting of command 16 with more than on/off: a block to set it and one to read it.
// CI-V: 16 xx + value, 16 xx -> value (p. 4)
function ic705Choice(suffix, label, sub, options, tooltip, group)
{
  Blockly.Blocks['ic705_set_' + suffix] = {
    init: function() {
      this.jsonInit({
        "message0": "Set " + label + " to %1",
        "args0": [
          {"type": "field_dropdown", "name": "VALUE", "options": options}
        ],
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": tooltip
      });
    }
  };

  Blockly.Lua.forBlock['ic705_set_' + suffix] = function(block) {
    return 'sendCommand({0x16, ' + sub + '}, {' + block.getFieldValue('VALUE') + '})\n';
  };

  Blockly.Blocks['ic705_get_' + suffix] = {
    init: function() {
      this.jsonInit({
        "message0": label,
        "output": "String",
        "tooltip": "Reads the " + label + ": " + options.map(function(option) { return option[0]; }).join(", ")
      });
    }
  };

  Blockly.Lua.forBlock['ic705_get_' + suffix] = function(block) {
    Studio.use(['ic705ReadName']);
    var names = options.map(function(option) { return '[' + parseInt(option[1], 16) + '] = "' + option[0] + '"'; });
    return ['ic705ReadName({0x16, ' + sub + '}, {' + names.join(', ') + '})', lua.Order.HIGH];
  };

  group.action('ic705_set_' + suffix);
  group.property('ic705_get_' + suffix);
}

// CI-V: 16 56 + 00 (SHARP) / 01 (SOFT) (p. 4)
ic705Choice('dsp_filter_type', 'DSP Filter Type', '0x56', [["SHARP", "0x00"], ["SOFT", "0x01"]],
            "Sets the shape of the DSP IF filter in the operating band", ic705Receiver);

// CI-V: 16 57 + 00 (WIDE) / 01 (MID) / 02 (NAR) (p. 4)
ic705Choice('notch_width', 'Manual Notch Width', '0x57', [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]],
            "Sets the width of the manual notch filter", ic705Receiver);

// CI-V: 16 5B + 00 (OFF) / 01 (DSQL) / 02 (CSQL) (p. 4)
ic705Choice('digital_squelch', 'Digital Squelch', '0x5B', [["OFF", "0x00"], ["DSQL", "0x01"], ["CSQL", "0x02"]],
            "Sets the digital call sign squelch (DSQL) or the digital code squelch (CSQL). DV mode only", ic705Receiver);

// CI-V: 16 5D + 00 ~ 03, 06 ~ 09 (p. 4)
ic705Choice('tone_function', 'Tone Function', '0x5D',
            [["OFF", "0x00"], ["TONE", "0x01"], ["TSQL", "0x02"], ["DTCS", "0x03"], ["DTCS(T)", "0x06"],
             ["TONE(T)/DTCS(R)", "0x07"], ["DTCS(T)/TSQL(R)", "0x08"], ["TONE(T)/TSQL(R)", "0x09"]],
            "Selects the repeater tone, tone squelch or DTCS function (FM mode)", ic705Transmit);

// CI-V: 16 58 + 00 (WIDE) / 01 (MID) / 02 (NAR) (p. 4)
ic705Choice('ssb_tx_bandwidth', 'SSB TX Bandwidth', '0x58', [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]],
            "Selects the SSB transmit bandwidth", ic705Transmit);

// CI-V: 16 47 + 00 (OFF) / 01 (semi) / 02 (full) (p. 4)
ic705Choice('break_in', 'Break-In', '0x47', [["OFF", "0x00"], ["semi", "0x01"], ["full", "0x02"]],
            "Sets the CW break-in function: off, semi or full break-in", ic705CwVoice);

// CI-V: 16 5C + 00 (OFF) / 01 (D-PRS) / 02 (NMEA) (p. 4)
ic705Choice('gps_tx_mode', 'GPS TX Mode', '0x5C', [["OFF", "0x00"], ["D-PRS", "0x01"], ["NMEA", "0x02"]],
            "Selects which position data is transmitted in DV mode", ic705Gps);

//-------------------------------------------------------------------
// CI-V: 14 0E + 0000 = 0 ~ 0255 = 10 (p. 4)
Blockly.Blocks['ic705_set_comp_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Compressor Level to %1",
      "args0": [
        {"type": "input_value", "name": "LEVEL", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the level of the speech compressor (0 ~ 10)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'LEVEL', 0, 10, "The compressor level must be between 0 and 10");
  }
};

Blockly.Lua.forBlock['ic705_set_comp_level'] = function(block) {
  Studio.use(['ic705Level']);
  return 'sendCommand({0x14, 0x0E}, ic705Level(' + ic705Value(block, 'LEVEL') + ', 0, 10))\n';
};

ic705Transmit.action("ic705_set_comp_level");

//-------------------------------------------------------------------
// CI-V: 14 0E -> 0000 = 0 ~ 0255 = 10 (p. 4)
Blockly.Blocks['ic705_get_comp_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Compressor Level",
      "output": "Number",
      "tooltip": "Reads the level of the speech compressor (0 ~ 10)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_comp_level'] = function(block) {
  Studio.use(['ic705ReadLevel']);
  return ['ic705ReadLevel({0x14, 0x0E}, 0, 10)', lua.Order.HIGH];
};

ic705Transmit.property("ic705_get_comp_level");

//-------------------------------------------------------------------
// Tone squelch frequency.
// CI-V: 1B 01 + 3 bytes BCD in 0.1 Hz (p. 14 and 21)
Blockly.Blocks['ic705_set_tsql_frequency'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Tone Squelch to %1 Hz",
      "args0": [
        {"type": "input_value", "name": "TONE", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the frequency of the tone squelch (CTCSS), e.g. 88.5 Hz"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'TONE', 67, 254.1, "The tone squelch frequency must be between 67.0 and 254.1 Hz");
  }
};

Blockly.Lua.forBlock['ic705_set_tsql_frequency'] = function(block) {
  Studio.use(['numberToBcd']);
  return 'sendCommand({0x1B, 0x01}, numberToBcd(math.floor(' + ic705Value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
};

ic705Transmit.action("ic705_set_tsql_frequency");

//-------------------------------------------------------------------
// CI-V: 1B 02 + polarity, 0 + first digit, second + third digit (p. 14 and 21)
Blockly.Blocks['ic705_set_dtcs_code'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set DTCS Code to %1 polarity %2",
      "args0": [
        {"type": "input_value", "name": "CODE", "check": "Number"},
        {
          "type": "field_dropdown",
          "name": "POLARITY",
          "options": [["normal", "0x00"], ["TX reverse", "0x10"], ["RX reverse", "0x01"], ["TX and RX reverse", "0x11"]]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the DTCS code (e.g. 23 for code 023, digits 0 ~ 7) and its polarity"
    });
  },
  onchange: function() {
    var input = this.getInputTargetBlock('CODE');
    var code = (input && input.type == 'math_number') ? input.getFieldValue('NUM') : null;
    this.setWarningText(code !== null && !/^[0-7]{1,3}$/.test(code) ? "A DTCS code has up to 3 digits from 0 to 7, e.g. 23" : null);
  }
};

Blockly.Lua.forBlock['ic705_set_dtcs_code'] = function(block) {
  Studio.use(['ic705DtcsData']);
  return 'sendCommand({0x1B, 0x02}, ic705DtcsData(' + ic705Value(block, 'CODE') + ', ' + block.getFieldValue('POLARITY') + '))\n';
};

ic705Transmit.action("ic705_set_dtcs_code");

//-------------------------------------------------------------------
// CI-V: 1B 02 -> polarity, 0 + first digit, second + third digit (p. 14 and 21)
Blockly.Blocks['ic705_get_dtcs_code'] = {
  init: function() {
    this.jsonInit({
      "message0": "DTCS Code",
      "output": "Number",
      "tooltip": "Reads the DTCS code, e.g. 23 for code 023"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_dtcs_code'] = function(block) {
  Studio.use(['ic705ReadDtcs']);
  return ['ic705ReadDtcs()', lua.Order.HIGH];
};

ic705Transmit.property("ic705_get_dtcs_code");

//-------------------------------------------------------------------
// CI-V: 1B 07 + 00 ~ 99 (p. 14 and 22)
Blockly.Blocks['ic705_set_csql_code'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Digital Code Squelch to %1",
      "args0": [
        {"type": "input_value", "name": "CODE", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the code of the digital code squelch (CSQL) in DV mode (0 ~ 99)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'CODE', 0, 99, "The code must be between 0 and 99");
  }
};

Blockly.Lua.forBlock['ic705_set_csql_code'] = function(block) {
  Studio.use(['numberToBcd']);
  return 'sendCommand({0x1B, 0x07}, numberToBcd(' + ic705Value(block, 'CODE') + ', 1))\n';
};

ic705Transmit.action("ic705_set_csql_code");

//-------------------------------------------------------------------
// CI-V: 14 09 + 0000 = 300 Hz ~ 0255 = 900 Hz (p. 4)
Blockly.Blocks['ic705_set_cw_pitch'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set CW Pitch to %1 Hz",
      "args0": [
        {"type": "input_value", "name": "PITCH", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the CW pitch (300 ~ 900 Hz)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'PITCH', 300, 900, "The CW pitch must be between 300 and 900 Hz");
  }
};

Blockly.Lua.forBlock['ic705_set_cw_pitch'] = function(block) {
  Studio.use(['ic705Level']);
  return 'sendCommand({0x14, 0x09}, ic705Level(' + ic705Value(block, 'PITCH') + ', 300, 900))\n';
};

ic705CwVoice.action("ic705_set_cw_pitch");

//-------------------------------------------------------------------
// CI-V: 14 0F + 0000 = 2.0 d ~ 0255 = 13.0 d (p. 4)
Blockly.Blocks['ic705_set_break_in_delay'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Break-In Delay to %1 dots",
      "args0": [
        {"type": "input_value", "name": "DELAY", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the delay of the semi break-in (2.0 ~ 13.0 dots)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'DELAY', 2, 13, "The break-in delay must be between 2.0 and 13.0 dots");
  }
};

Blockly.Lua.forBlock['ic705_set_break_in_delay'] = function(block) {
  Studio.use(['ic705Level']);
  return 'sendCommand({0x14, 0x0F}, ic705Level(' + ic705Value(block, 'DELAY') + ', 2, 13))\n';
};

ic705CwVoice.action("ic705_set_break_in_delay");

//-------------------------------------------------------------------
// CI-V: 14 09 -> 0000 = 300 Hz ~ 0255 = 900 Hz (p. 4)
Blockly.Blocks['ic705_get_cw_pitch'] = {
  init: function() {
    this.jsonInit({
      "message0": "CW Pitch",
      "output": "Number",
      "tooltip": "Reads the CW pitch (in Hz)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_cw_pitch'] = function(block) {
  Studio.use(['ic705ReadNumber']);
  return ['math.floor(300 + ic705ReadNumber({0x14, 0x09}) * 600 / 255 + 0.5)', lua.Order.HIGH];
};

ic705CwVoice.property("ic705_get_cw_pitch");

//-------------------------------------------------------------------
// CI-V: 14 0F -> 0000 = 2.0 d ~ 0255 = 13.0 d (p. 4)
Blockly.Blocks['ic705_get_break_in_delay'] = {
  init: function() {
    this.jsonInit({
      "message0": "Break-In Delay",
      "output": "Number",
      "tooltip": "Reads the delay of the semi break-in (in dots)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_break_in_delay'] = function(block) {
  Studio.use(['ic705ReadLevel']);
  return ['ic705ReadLevel({0x14, 0x0F}, 2, 13)', lua.Order.HIGH];
};

ic705CwVoice.property("ic705_get_break_in_delay");

//-------------------------------------------------------------------
// CI-V: 15 05 -> 00 (closed) / 01 (open) (p. 4)
Blockly.Blocks['ic705_is_tone_squelch_open'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Tone Squelch open?",
      "output": "Boolean",
      "tooltip": "True if the tone squelch (or DTCS, DSQL, CSQL) is open, i.e. a matching signal is received"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_tone_squelch_open'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x15, 0x05})', lua.Order.HIGH];
};

ic705Receiver.property("ic705_is_tone_squelch_open");

//-------------------------------------------------------------------
// CI-V: 15 07 -> 00 (OVF off) / 01 (OVF on) (p. 4)
Blockly.Blocks['ic705_is_overflow'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is Overflow?",
      "output": "Boolean",
      "tooltip": "True if the OVF indicator is on, i.e. the receiver is overloaded by a strong signal"
    });
  }
};

Blockly.Lua.forBlock['ic705_is_overflow'] = function(block) {
  Studio.use(['ic705ReadOn']);
  return ['ic705ReadOn({0x15, 0x07})', lua.Order.HIGH];
};

ic705Meters.property("ic705_is_overflow");

//-------------------------------------------------------------------
// CI-V: 15 14 -> 0000 = 0 dB, 0130 = 15 dB, 0210 = 25.5 dB (p. 4)
Blockly.Blocks['ic705_get_comp_meter'] = {
  init: function() {
    this.jsonInit({
      "message0": "Compression",
      "output": "Number",
      "tooltip": "Reads the COMP meter while transmitting with the speech compressor (in dB)"
    });
  }
};

Blockly.Lua.forBlock['ic705_get_comp_meter'] = function(block) {
  Studio.use(['ic705Meter']);
  return ['ic705Meter({0x15, 0x14}, {{0, 0}, {130, 15}, {210, 25.5}})', lua.Order.HIGH];
};

ic705Meters.property("ic705_get_comp_meter");

//-------------------------------------------------------------------
// Any setting of the menu. The number of the setting is in the CI-V reference guide, e.g. 0029 for the beep level.
// CI-V: 1A 05 + number of the setting (2 bytes BCD) + value (BCD) (p. 5 ~ 13)
Blockly.Blocks['ic705_set_menu'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Menu Setting %1 to %2 %3",
      "args0": [
        {"type": "input_value", "name": "ITEM", "check": "Number"},
        {"type": "input_value", "name": "VALUE", "check": "Number"},
        {"type": "field_dropdown", "name": "BYTES", "options": [["as 00 ~ 99", "1"], ["as 0000 ~ 9999", "2"]]}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Changes a setting of the menu (command 1A 05). The number of the setting and the format of its value " +
                 "(00 ~ 99 or 0000 ~ 9999) are in the CI-V reference guide, e.g. 29 for the beep level (0000 ~ 0255)"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'ITEM', 1, 9999, "The number of the setting must be between 1 and 9999");
  }
};

Blockly.Lua.forBlock['ic705_set_menu'] = function(block) {
  Studio.use(['ic705MenuCmd', 'numberToBcd']);
  return 'sendCommand(ic705MenuCmd(' + ic705Value(block, 'ITEM') + '), numberToBcd(' + ic705Value(block, 'VALUE') + ', ' +
         block.getFieldValue('BYTES') + '))\n';
};

ic705Settings.action("ic705_set_menu");

//-------------------------------------------------------------------
// CI-V: 1A 05 + number of the setting (2 bytes BCD) -> value (BCD) (p. 5 ~ 13)
Blockly.Blocks['ic705_get_menu'] = {
  init: function() {
    this.jsonInit({
      "message0": "Menu Setting %1",
      "args0": [
        {"type": "input_value", "name": "ITEM", "check": "Number"}
      ],
      "inputsInline": true,
      "output": "Number",
      "tooltip": "Reads a setting of the menu (command 1A 05) as number, e.g. 29 for the beep level"
    });
  },
  onchange: function() {
    ic705CheckRange(this, 'ITEM', 1, 9999, "The number of the setting must be between 1 and 9999");
  }
};

Blockly.Lua.forBlock['ic705_get_menu'] = function(block) {
  Studio.use(['ic705MenuCmd', 'ic705ReadNumber']);
  return ['ic705ReadNumber(ic705MenuCmd(' + ic705Value(block, 'ITEM') + '))', lua.Order.HIGH];
};

ic705Settings.property("ic705_get_menu");

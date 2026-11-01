// Builds the blocks of an Icom radio from a description of its CI-V commands.
//
// Most Icom radios understand the same CI-V commands as the IC-705 (see radio/ic705.js). They differ in
// the details: the operating modes, the attenuator steps, the scales of the meters, the memory channels, ...
// A radio file describes these details and Icom.radio() creates the blocks, e.g. ic7610_set_frequency.
// Everything the description leaves out is not supported by the radio, so its blocks are not created.
//
// How the firmware handles commands (the same for all radios):
// - sendCommand(cmd[, data]) sends the bytes of cmd and data and returns cmd
// - readResultOfCommand(cmd) returns the data of the last answer to cmd, or nil if there was none yet.
//   The answer is matched by its command bytes. The library takes 2 bytes as command for
//   07 0E 13 14 15 16 19 1A 1B 1C 1E 21 27, 4 bytes for 1A 05 and 1 byte for all others.
//
// Usage in a radio file (see radio/ic7610.js for a complete description):
//
//   Icom.radio({
//     "prefix": "ic7610",                       // prefix of the block types
//     "name": "IC-7610",                        // name of the category in the toolbox
//     "modes": {"page": 10, "options": [["LSB", "0x00"], ["USB", "0x01"], ...]},
//     "attenuator": {"page": 3, "options": [["OFF", "0x00"], ["3 dB", "0x03"], ...]},
//     ...
//   });
//
// Every entry has the page of the CI-V reference guide where the command is described. The pages are
// used in the documentation of the blocks (documentation/radio/<prefix>.md).
//
// The entries (all optional except prefix and name):
//   prefix, name, address, reference, note   block types, category, default CI-V address, reference guide, note for the docs
//   frequency, modes, dataMode, tuningSteps   05/03, 06/04 (options), 1A 06, 10 (options)
//   vfo                                       07 (options; separate: one block per option, 3rd entry is the suffix)
//   equalize, exchange, dualwatch             07 A0/B1 and B0 (code, what), 07 C0/C1/C2
//   split, memory, rit, scan                  0F (options), 08 (min, max), 21 01/21 00 (offsetPage), 0E (options)
//   afLevel, rfGain, squelchLevel             14 01/02/03 (input: name of the input, LEVEL)
//   preamp, attenuator, agc                   16 02, 11, 16 12 (options; field, message, tooltip, default, onValue)
//   squelchStatus, toneSquelchStatus          15 01 (sub), 15 05
//   choices                                   16 xx with more than on/off: names of CHOICES or own entries
//   transmit, rfPower, rfPowerSteps, micGain  1C 00, 14 0A (input) or steps [name, value, highest value], 14 0B
//   tone, tsql, dtcs, csql, compLevel         1B 00, 1B 01, 1B 02, 1B 07, 14 0E
//   sMeter, swr, powerOutput, alc, voltage,   15 02 (s9, plus60), 15 12/11/13/15/16/14 (points of the scale;
//   current, compMeter                        unit "W" for the power output)
//   battery, overflow                         1A 0B, 15 07
//   cw, keyingSpeed, voiceMemory, announce    17, 14 0C, 28 00, 13
//   cwPitch, breakInDelay                     14 09, 14 0F
//   position, clock                           23 00 (label, text), 1A 05 (date, time: the numbers of the settings)
//   functions, brightness, power              16 xx on/off (options), 14 19, 18
//   levels, menu                              14 xx in one block: names of LEVELS or own [name, sub], 1A 05 + number
//
// Languages: the texts of the blocks are in msg/en.js (ICOM_...). The texts of a description (e.g. the names of the
// options) stay english, the block shows their translation if msg/*.js has one (ICOM_TERM_..., see term()).
// The names which the read blocks return to the program (e.g. "USB", "FAST") are never translated,
// so a program works the same in every language.

/**
 * Creates the blocks of Icom radios. The only global this file adds.
 * @namespace
 */
var Icom = (function() {

  var ON_OFF = [[Blockly.Msg.ICOM_ON, "0x01"], [Blockly.Msg.ICOM_OFF, "0x00"]];
  var UNITS = [["Hz", "1"], ["kHz", "1e3"], ["MHz", "1e6"]];

  // The groups of a radio category, in the order of the toolbox (the same as for the IC-705), with the text of their name
  var GROUPS = ["Frequency & Mode", "Receiver", "Transmit", "Meters", "CW & Voice", "GPS & Time", "Settings"];
  var GROUP_NAMES = {
    "Frequency & Mode": Blockly.Msg.ICOM_GROUP_FREQUENCY_MODE, "Receiver": Blockly.Msg.ICOM_GROUP_RECEIVER,
    "Transmit": Blockly.Msg.ICOM_GROUP_TRANSMIT, "Meters": Blockly.Msg.ICOM_GROUP_METERS, "CW & Voice": Blockly.Msg.ICOM_GROUP_CW_VOICE,
    "GPS & Time": Blockly.Msg.ICOM_GROUP_GPS_TIME, "Settings": Blockly.Msg.ICOM_GROUP_SETTINGS
  };

  // The usual settings of command 16 with more than on/off. A radio lists the ones it has in spec.choices by name.
  var CHOICES = {
    "dsp_filter_type": {"label": Blockly.Msg.ICOM_DSP_FILTER_TYPE, "sub": "0x56", "group": "Receiver",
                        "options": [["SHARP", "0x00"], ["SOFT", "0x01"]], "tooltip": Blockly.Msg.ICOM_DSP_FILTER_TYPE_TOOLTIP},
    "notch_width": {"label": Blockly.Msg.ICOM_NOTCH_WIDTH, "sub": "0x57", "group": "Receiver",
                    "options": [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]], "tooltip": Blockly.Msg.ICOM_NOTCH_WIDTH_TOOLTIP},
    "digital_squelch": {"label": Blockly.Msg.ICOM_DIGITAL_SQUELCH, "sub": "0x5B", "group": "Receiver",
                        "options": [["OFF", "0x00"], ["DSQL", "0x01"], ["CSQL", "0x02"]],
                        "tooltip": Blockly.Msg.ICOM_DIGITAL_SQUELCH_TOOLTIP},
    "tone_function": {"label": Blockly.Msg.ICOM_TONE_FUNCTION, "sub": "0x5D", "group": "Transmit",
                      "options": [["OFF", "0x00"], ["TONE", "0x01"], ["TSQL", "0x02"], ["DTCS", "0x03"], ["DTCS(T)", "0x06"],
                                  ["TONE(T)/DTCS(R)", "0x07"], ["DTCS(T)/TSQL(R)", "0x08"], ["TONE(T)/TSQL(R)", "0x09"]],
                      "tooltip": Blockly.Msg.ICOM_TONE_FUNCTION_TOOLTIP},
    "ssb_tx_bandwidth": {"label": Blockly.Msg.ICOM_SSB_TX_BANDWIDTH, "sub": "0x58", "group": "Transmit",
                         "options": [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]], "tooltip": Blockly.Msg.ICOM_SSB_TX_BANDWIDTH_TOOLTIP},
    "break_in": {"label": Blockly.Msg.ICOM_BREAK_IN, "sub": "0x47", "group": "CW & Voice",
                 "options": [["OFF", "0x00"], ["semi", "0x01"], ["full", "0x02"]], "tooltip": Blockly.Msg.ICOM_BREAK_IN_TOOLTIP},
    "gps_tx_mode": {"label": Blockly.Msg.ICOM_GPS_TX_MODE, "sub": "0x5C", "group": "GPS & Time",
                    "options": [["OFF", "0x00"], ["D-PRS", "0x01"], ["NMEA", "0x02"]], "tooltip": Blockly.Msg.ICOM_GPS_TX_MODE_TOOLTIP}
  };

  // The usual levels 0 ~ 100 % of command 14 for the block "Set Level". A radio lists the ones it has in spec.levels by name.
  var LEVELS = {
    "nr": [Blockly.Msg.ICOM_LEVEL_NR, "0x06"], "nb": [Blockly.Msg.ICOM_LEVEL_NB, "0x12"],
    "pbt1": [Blockly.Msg.ICOM_LEVEL_PBT1, "0x07"], "pbt2": [Blockly.Msg.ICOM_LEVEL_PBT2, "0x08"],
    "notch": [Blockly.Msg.ICOM_LEVEL_NOTCH, "0x0D"], "monitor": [Blockly.Msg.ICOM_LEVEL_MONITOR, "0x15"],
    "vox": [Blockly.Msg.ICOM_LEVEL_VOX, "0x16"], "antivox": [Blockly.Msg.ICOM_LEVEL_ANTIVOX, "0x17"]
  };

  /* **************************************************************** */
  /*                          LUA FUNCTIONS                           */
  /* **************************************************************** */
  // Shared by all radios which are described with Icom.radio()

  // Sends a read command and returns the data of the last answer, or an empty table if there was none yet
  Studio.luaFunction('icomQuery', [
    'function icomQuery(cmd, data)',
    '  local key',
    '  if data then key = sendCommand(cmd, data) else key = sendCommand(cmd) end',
    '  if key == nil then return {} end',
    '  return readResultOfCommand(key) or {}',
    'end'
  ]);

  // Reads a BCD value (e.g. 0000 ~ 0255), 0 if there is no answer yet
  Studio.luaFunction('icomReadNumber', [
    'function icomReadNumber(cmd, data)',
    '  local d = icomQuery(cmd, data)',
    '  if #d == 0 then return 0 end',
    '  return bcdToNumber(d) or 0',
    'end'
  ], ['icomQuery', 'bcdToNumber']);

  // Reads a level 0000 ~ 0255 in %
  Studio.luaFunction('icomReadPercent', [
    'function icomReadPercent(cmd)',
    '  return math.floor(icomReadNumber(cmd) * 100 / 255 + 0.5)',
    'end'
  ], ['icomReadNumber']);

  // Reads the first byte of the answer, 0 if there is no answer yet
  Studio.luaFunction('icomReadByte', [
    'function icomReadByte(cmd, data)',
    '  return icomQuery(cmd, data)[1] or 0',
    'end'
  ], ['icomQuery']);

  // Reads a 00=OFF / 01=ON setting
  Studio.luaFunction('icomReadOn', [
    'function icomReadOn(cmd)',
    '  return icomReadByte(cmd) == 1',
    'end'
  ], ['icomReadByte']);

  // Converts 0 ~ 100 % into the 2 byte BCD level 0000 ~ 0255
  Studio.luaFunction('icomPercent', [
    'function icomPercent(percent)',
    '  percent = math.max(0, math.min(100, percent))',
    '  return numberToBcd(math.floor(percent * 255 / 100 + 0.5), 2)',
    'end'
  ], ['numberToBcd']);

  // Reads the operating frequency in Hz (command 03), 0 if there is no answer yet
  Studio.luaFunction('icomReadFrequency', [
    'function icomReadFrequency()',
    '  local d = icomQuery({0x03})',
    '  if #d == 0 then return 0 end',
    '  return frequencyAsNumber(d)',
    'end'
  ], ['icomQuery', 'frequencyAsNumber']);

  // Name of a setting in an answer: names maps the first byte, or first byte * 256 + second byte
  // (e.g. mode and filter) to the name. Numbers as keys, because the firmware passes the bytes as floats.
  Studio.luaFunction('icomName', [
    'function icomName(d, names, default)',
    '  if d[1] == nil then return default end',
    '  local name = d[2] and names[d[1] * 256 + d[2]]',
    '  return name or names[d[1]] or default',
    'end'
  ]);

  // Linear interpolation between the points {{raw, value}, ...} of a meter scale
  Studio.luaFunction('icomScale', [
    'function icomScale(raw, points)',
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
  Studio.luaFunction('icomMeter', [
    'function icomMeter(cmd, points)',
    '  return math.floor(icomScale(icomReadNumber(cmd), points) * 10 + 0.5) / 10',
    'end'
  ], ['icomReadNumber', 'icomScale']);

  // Converts a text into ASCII codes for a CW message (command 17, max. 30 characters)
  Studio.luaFunction('icomTextBytes', [
    'function icomTextBytes(text)',
    '  local t = {}',
    '  text = tostring(text)',
    '  for i = 1, math.min(#text, 30) do',
    '    t[i] = string.byte(text, i)',
    '  end',
    '  return t',
    'end'
  ]);

  // Converts 6 ~ 48 WPM into the keying speed level 0000 ~ 0255 (command 14 0C)
  Studio.luaFunction('icomWpm', [
    'function icomWpm(wpm)',
    '  wpm = math.max(6, math.min(48, wpm))',
    '  return numberToBcd(math.floor((wpm - 6) * 255 / 42 + 0.5), 2)',
    'end'
  ], ['numberToBcd']);

  // Converts -9999 ~ +9999 Hz into the RIT frequency data (command 21 00)
  Studio.luaFunction('icomRitData', [
    'function icomRitData(hz)',
    '  hz = math.floor(hz + 0.5)',
    '  local sign = 0',
    '  if hz < 0 then sign = 1; hz = -hz end',
    '  local t = frequencyToBcd(math.min(hz, 9999), 2)',
    '  table.insert(t, sign)',
    '  return t',
    'end'
  ], ['frequencyToBcd']);

  // Reads the position and time (command 23 00). Returns nil if there is no answer yet.
  Studio.luaFunction('icomGps', [
    'function icomGps()',
    '  local d = icomQuery({0x23}, {0x00})   -- d[1] is the sub command 00',
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
  ], ['icomQuery']);

  // One value of the position: lat, lon, alt, course or speed. 0 if there is no answer yet.
  Studio.luaFunction('icomGpsValue', [
    'function icomGpsValue(name)',
    '  local g = icomGps()',
    '  if g == nil then return 0 end',
    '  return g[name]',
    'end'
  ], ['icomGps']);

  // Seconds since 1970-01-01 00:00:00 UTC
  Studio.luaFunction('icomUnixTime', [
    'function icomUnixTime(y, m, d, hour, minute, second)',
    '  if m <= 2 then y = y - 1; m = m + 12 end',
    '  local days = 365 * y + math.floor(y / 4) - math.floor(y / 100) + math.floor(y / 400)',
    '  days = days + math.floor((153 * (m - 3) + 2) / 5) + d - 719469',
    '  return days * 86400 + hour * 3600 + minute * 60 + second',
    'end'
  ]);

  // One part of the GPS time (UTC): unix, text, year, month, day, hour, minute or second
  Studio.luaFunction('icomGpsTime', [
    'function icomGpsTime(part)',
    '  local g = icomGps()',
    '  if g == nil then',
    '    if part == "text" then return "" end',
    '    return 0',
    '  end',
    '  if part == "unix" then return icomUnixTime(g.year, g.month, g.day, g.hour, g.minute, g.second) end',
    '  if part == "text" then',
    '    return string.format("%04d-%02d-%02d %02d:%02d:%02d", g.year, g.month, g.day, g.hour, g.minute, g.second)',
    '  end',
    '  return g[part]',
    'end'
  ], ['icomGps', 'icomUnixTime']);

  // One part of the clock of the radio (local time): time, date, year, month, day, hour or minute.
  // dateCmd and timeCmd are the 1A 05 commands of the radio
  Studio.luaFunction('icomClock', [
    'function icomClock(dateCmd, timeCmd, part)',
    '  local d = icomQuery(dateCmd)',
    '  local t = icomQuery(timeCmd)',
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
  ], ['icomQuery']);

  // Converts a value between min and max into the 2 byte BCD level 0000 ~ 0255
  Studio.luaFunction('icomLevel', [
    'function icomLevel(value, min, max)',
    '  value = math.max(min, math.min(max, value))',
    '  return numberToBcd(math.floor((value - min) * 255 / (max - min) + 0.5), 2)',
    'end'
  ], ['numberToBcd']);

  // Reads a level 0000 ~ 0255 and converts it into a value between min and max, rounded to 0.1
  Studio.luaFunction('icomReadLevel', [
    'function icomReadLevel(cmd, min, max)',
    '  return math.floor((min + icomReadNumber(cmd) * (max - min) / 255) * 10 + 0.5) / 10',
    'end'
  ], ['icomReadNumber']);

  // Data of the DTCS code (e.g. 23 for code 023) and the polarity (command 1B 02)
  Studio.luaFunction('icomDtcsData', [
    'function icomDtcsData(code, polarity)',
    '  local s = string.format("%03d", math.max(0, math.min(777, math.floor(code))))',
    '  return {polarity, tonumber(s:sub(1, 1)), tonumber(s:sub(2, 2)) * 16 + tonumber(s:sub(3, 3))}',
    'end'
  ]);

  // Reads the DTCS code (e.g. 23 for code 023), 0 if there is no answer yet
  Studio.luaFunction('icomReadDtcs', [
    'function icomReadDtcs()',
    '  local d = icomQuery({0x1B, 0x02})',
    '  if #d < 3 then return 0 end',
    '  return (d[2] % 16) * 100 + math.floor(d[3] / 16) * 10 + d[3] % 16',
    'end'
  ], ['icomQuery']);

  // The command of a menu setting: 1A 05 + the number of the setting as 2 bytes BCD, e.g. 0029
  Studio.luaFunction('icomMenuCmd', [
    'function icomMenuCmd(item)',
    '  local b = numberToBcd(item, 2)',
    '  return {0x1A, 0x05, b[1], b[2]}',
    'end'
  ], ['numberToBcd']);

  // Maidenhead locator (6 characters) of a position, e.g. JN77rb
  Studio.luaFunction('icomLocator', [
    'function icomLocator(lat, lon)',
    '  lon = lon + 180',
    '  lat = lat + 90',
    '  local A, a = string.byte("A"), string.byte("a")',
    '  return string.char(A + math.floor(lon / 20), A + math.floor(lat / 10))',
    '      .. math.floor((lon % 20) / 2) .. math.floor(lat % 10)',
    '      .. string.char(a + math.floor((lon % 2) * 12), a + math.floor((lat % 1) * 24))',
    'end'
  ]);

  /* **************************************************************** */
  /*                          HELPERS                                 */
  /* **************************************************************** */

  // Lua code of a value input, "0" if nothing is connected
  function value(block, name, order)
  {
    return Blockly.Lua.valueToCode(block, name, order || lua.Order.NONE) || '0';
  }

  // Warns while editing, if a plain number at the input is out of range
  function checkRange(block, name, min, max, text)
  {
    var input = block.getInputTargetBlock(name);
    var number = (input && input.type == 'math_number') ? Number(input.getFieldValue('NUM')) : null;
    block.setWarningText(number !== null && (number < min || number > max) ? text : null);
  }

  // "0x05" -> 5, "0x05, 0x02" -> 5 * 256 + 2: the key of a setting in the lua table of icomName()
  function nameKey(code)
  {
    return code.split(',').reduce(function(key, byte) { return key * 256 + parseInt(byte, 16); }, 0);
  }

  // Lua table which maps the codes of the options to their names, e.g. {[0] = "LSB", [1282] = "FM-N"}
  function nameTable(options)
  {
    return '{' + options.map(function(option) {
      return '[' + nameKey(option[1]) + '] = "' + option[0] + '"';
    }).join(', ') + '}';
  }

  // Lua table of the points of a meter scale, e.g. {{0, 0}, {120, 9}}
  function pointsTable(points)
  {
    return '{' + points.map(function(point) { return '{' + point[0] + ', ' + point[1] + '}'; }).join(', ') + '}';
  }

  // "0x14, 0x0A" -> "14 0A" for the documentation
  function civBytes(code)
  {
    return code.split(',').map(function(byte) { return byte.trim().replace(/^0x/, '').toUpperCase(); }).join(' ');
  }

  // A text of msg/*.js with its {placeholders} replaced, e.g. msg("ICOM_SELECT_VFO", {"vfo": "VFO A"})
  function msg(key, values)
  {
    return Blockly.Msg[key].replace(/\{(\w+)\}/g, function(all, name) { return values[name]; });
  }

  // The key of a text of a radio description in msg/*.js: "Split on" -> ICOM_TERM_Split_on, "fine ΔF" -> ICOM_TERM_fine_delta_F.
  // Upper and lower case are kept: "OFF" (as written on the radio) is not the same as "off".
  // tests/test_i18n.py builds the keys the same way
  function termKey(text)
  {
    return "ICOM_TERM_" + text.replace(/Δ/g, " delta ").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  // The translation of a text of a radio description (e.g. an option of a dropdown), or the text itself
  function term(text)
  {
    return Blockly.Msg[termKey(text)] || text;
  }

  // The options of a dropdown with translated names. Only for the dropdown: nameTable() needs the original names
  function termOptions(options)
  {
    return options.map(function(option) { return [term(option[0])].concat(option.slice(1)); });
  }

  // Translated names of the options, e.g. "LSB, USB or AM".
  // returned: the names as the read block returns them to the program, i.e. not translated
  function optionNames(options, returned)
  {
    var names = options.map(function(option) { return returned ? option[0] : term(option[0]); });
    return names.length > 1 ? msg("ICOM_OR", {"list": names.slice(0, -1).join(', '), "last": names[names.length - 1]}) : names.join('');
  }

  /* **************************************************************** */
  /*                          THE RADIO                               */
  /* **************************************************************** */

  // All radios which have been described, for the documentation: [{spec, blocks: [{type, group, kind, civ, page}]}]
  var radios = [];

  /**
   * Creates the category and the blocks of a radio from its description.
   * Has to be called directly by the radio file (not later), so the help links point to its documentation.
   * See radio/ic7610.js for a description with all entries.
   * @param {Object} spec the description of the radio
   */
  function radio(spec)
  {
    var p = spec.prefix;
    var category = Studio.category(spec.name, "radio");

    // Choices and levels can be given by their name in CHOICES and LEVELS
    if (spec.choices)
    {
      spec.choices.options = spec.choices.options.map(function(choice) {
        return typeof choice == 'string' ? Object.assign({"suffix": choice}, CHOICES[choice]) : choice;
      });
    }
    if (spec.levels)
    {
      spec.levels.options = spec.levels.options.map(function(level) {
        return typeof level == 'string' ? LEVELS[level] : level;
      });
    }
    var groups = {};
    var registered = {"spec": spec, "blocks": []};
    radios.push(registered);

    // The groups are created when their first block is added, so there are no empty groups
    function group(name)
    {
      if (!groups[name])
      {
        groups[name] = {"blocks": []};
      }
      return groups[name];
    }

    // Defines a block. kind: action, property or helper. doc: {civ, page} for the documentation
    function define(groupName, kind, suffix, json, generator, onchange, doc)
    {
      var type = p + '_' + suffix;
      if (kind == 'action')
      {
        json.previousStatement = null;
        json.nextStatement = null;
      }
      Blockly.Blocks[type] = {
        init: function() {
          this.jsonInit(json);
        }
      };
      if (onchange)
      {
        Blockly.Blocks[type].onchange = function() {
          onchange(this);
        };
      }
      Blockly.Lua.forBlock[type] = generator;
      group(groupName).blocks.push({"kind": kind, "type": type});
      registered.blocks.push({"type": type, "group": groupName, "kind": kind, "json": json,
                              "civ": doc ? doc.civ : null, "page": doc ? doc.page : null});
    }

    // Defines a level 0 ~ 100 % (command 14 xx): a set block and a read block.
    // entry.input is the name of the input of the set block (LEVEL if it is missing)
    function level(entry, sub, suffix, label, text)
    {
      if (!entry)
      {
        return;
      }
      var cmd = '{0x14, ' + sub + '}';
      var input = entry.input || 'LEVEL';
      define(entry.group, 'action', 'set_' + suffix, {
        "message0": msg("ICOM_SET_LEVEL", {"label": label}),
        "args0": [{"type": "input_value", "name": input, "check": "Number"}],
        "inputsInline": true,
        "tooltip": msg("ICOM_SET_LEVEL_TOOLTIP", {"text": text})
      }, function(block) {
        Studio.use(['icomPercent']);
        return 'sendCommand(' + cmd + ', icomPercent(' + value(block, input) + '))\n';
      }, function(block) {
        checkRange(block, input, 0, 100, msg("ICOM_LEVEL_RANGE", {"label": label}));
      }, {"civ": "14 " + civBytes(sub) + " + 0000 ~ 0255", "page": entry.page});

      define(entry.group, 'property', 'get_' + suffix, {
        "message0": label,
        "output": "Number",
        "tooltip": msg("ICOM_GET_LEVEL_TOOLTIP", {"text": text})
      }, function(block) {
        Studio.use(['icomReadPercent']);
        return ['icomReadPercent(' + cmd + ')', lua.Order.HIGH];
      }, null, {"civ": "14 " + civBytes(sub) + " -> 0000 ~ 0255", "page": entry.page});
    }

    // Defines a read block for a meter (command 15 xx) with its scale
    function meter(entry, sub, suffix, label, unit, text)
    {
      if (!entry)
      {
        return;
      }
      define("Meters", 'property', suffix, {
        "message0": label,
        "output": "Number",
        "tooltip": text
      }, function(block) {
        Studio.use(['icomMeter']);
        return ['icomMeter({0x15, ' + sub + '}, ' + pointsTable(entry.points) + ')', lua.Order.HIGH];
      }, null, {"civ": "15 " + civBytes(sub) + " -> " + entry.points.map(function(point) {
        return String(point[0]).padStart(4, '0') + ' = ' + point[1] + unit;
      }).join(', '), "page": entry.page});
    }

    /* ------------------------------ FREQUENCY & MODE ------------------------------ */

    if (spec.frequency)
    {
      define("Frequency & Mode", 'action', 'set_frequency', {
        "message0": Blockly.Msg.ICOM_SET_FREQUENCY,
        "args0": [
          {"type": "input_value", "name": "FREQUENCY", "check": "Number"},
          {"type": "field_dropdown", "name": "UNIT", "options": UNITS}
        ],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_FREQUENCY_TOOLTIP
      }, function(block) {
        var frequency = value(block, 'FREQUENCY', lua.Order.MULTIPLICATIVE);
        Studio.use(['frequencyToBcd']);
        return 'sendCommand({0x05}, frequencyToBcd(' + frequency + ' * ' + block.getFieldValue('UNIT') + ', 5))\n';
      }, null, {"civ": "05 + 5 bytes BCD, least significant byte first", "page": spec.frequency.page});
    }

    if (spec.modes)
    {
      define("Frequency & Mode", 'action', 'set_operating_mode', {
        "message0": Blockly.Msg.ICOM_SET_OPERATING_MODE,
        "args0": [{"type": "field_dropdown", "name": "MODE", "options": termOptions(spec.modes.options)}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_OPERATING_MODE_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x06}, {' + block.getFieldValue('MODE') + '})\n';
      }, null, {"civ": "06 + mode", "page": spec.modes.page});
    }

    if (spec.dataMode)
    {
      define("Frequency & Mode", 'action', 'set_data_mode', {
        "message0": Blockly.Msg.ICOM_SET_DATA_MODE,
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [[Blockly.Msg.ICOM_ON, "{0x01, 0x01}"], [Blockly.Msg.ICOM_OFF, "{0x00, 0x00}"]]}],
        "tooltip": Blockly.Msg.ICOM_SET_DATA_MODE_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x1A, 0x06}, ' + block.getFieldValue('STATE') + ')\n';
      }, null, {"civ": "1A 06 + 01 01 (on, FIL1) / 00 00 (off)", "page": spec.dataMode.page});
    }

    if (spec.tuningSteps)
    {
      define("Frequency & Mode", 'action', 'set_tuning_step', {
        "message0": Blockly.Msg.ICOM_SET_TUNING_STEP,
        "args0": [{"type": "field_dropdown", "name": "STEP", "options": termOptions(spec.tuningSteps.options)}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_TUNING_STEP_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x10, ' + block.getFieldValue('STEP') + '})\n';
      }, null, {"civ": "10 + step", "page": spec.tuningSteps.page});
    }

    // One block per VFO (e.g. "Select VFO A"), if the options have a third entry: the suffix of the block type
    if (spec.vfo && spec.vfo.separate)
    {
      spec.vfo.options.forEach(function(option) {
        define("Frequency & Mode", 'action', 'select_vfo_' + option[2], {
          "message0": msg("ICOM_SELECT_VFO", {"vfo": term(option[0])}),
          "tooltip": msg("ICOM_SELECT_VFO_TOOLTIP", {"vfo": term(option[0])})
        }, function(block) {
          return 'sendCommand({0x07, ' + option[1] + '})\n';
        }, null, {"civ": "07 " + civBytes(option[1]), "page": spec.vfo.page});
      });
    }
    else if (spec.vfo)
    {
      define("Frequency & Mode", 'action', 'select_vfo', {
        "message0": Blockly.Msg.ICOM_SELECT,
        "args0": [{"type": "field_dropdown", "name": "VFO", "options": termOptions(spec.vfo.options)}],
        "tooltip": msg("ICOM_SELECT_TOOLTIP", {"options": optionNames(spec.vfo.options)})
      }, function(block) {
        return 'sendCommand({0x07, ' + block.getFieldValue('VFO') + '})\n';
      }, null, {"civ": "07 + " + spec.vfo.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": spec.vfo.page});
    }

    if (spec.equalize)
    {
      define("Frequency & Mode", 'action', 'equalize_vfo', {
        "message0": msg("ICOM_EQUALIZE", {"what": term(spec.equalize.what)}),
        "tooltip": msg("ICOM_EQUALIZE_TOOLTIP", {"what": term(spec.equalize.what)})
      }, function(block) {
        return 'sendCommand({0x07, ' + spec.equalize.code + '})\n';
      }, null, {"civ": "07 " + civBytes(spec.equalize.code), "page": spec.equalize.page});
    }

    if (spec.exchange)
    {
      define("Frequency & Mode", 'action', 'exchange_vfo', {
        "message0": msg("ICOM_EXCHANGE", {"what": term(spec.exchange.what)}),
        "tooltip": msg("ICOM_EXCHANGE_TOOLTIP", {"what": term(spec.exchange.what)})
      }, function(block) {
        return 'sendCommand({0x07, ' + spec.exchange.code + '})\n';
      }, null, {"civ": "07 " + civBytes(spec.exchange.code), "page": spec.exchange.page});
    }

    if (spec.dualwatch)
    {
      define("Frequency & Mode", 'action', 'set_dualwatch', {
        "message0": Blockly.Msg.ICOM_SET_DUALWATCH,
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [[Blockly.Msg.ICOM_ON, "0xC1"], [Blockly.Msg.ICOM_OFF, "0xC0"]]}],
        "tooltip": Blockly.Msg.ICOM_SET_DUALWATCH_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x07, ' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "07 C1 (on) / 07 C0 (off)", "page": spec.dualwatch.page});
    }

    if (spec.split)
    {
      define("Frequency & Mode", 'action', 'set_split', {
        "message0": Blockly.Msg.ICOM_SET_SPLIT,
        "args0": [{"type": "field_dropdown", "name": "SPLIT", "options": termOptions(spec.split.options)}],
        "tooltip": msg("ICOM_SELECT_TOOLTIP", {"options": optionNames(spec.split.options)})
      }, function(block) {
        return 'sendCommand({0x0F, ' + block.getFieldValue('SPLIT') + '})\n';
      }, null, {"civ": "0F + " + spec.split.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": spec.split.page});
    }

    if (spec.memory)
    {
      var memory = spec.memory;
      define("Frequency & Mode", 'action', 'select_memory', {
        "message0": Blockly.Msg.ICOM_SELECT_MEMORY,
        "args0": [{"type": "input_value", "name": "CHANNEL", "check": "Number"}],
        "inputsInline": true,
        "tooltip": msg("ICOM_SELECT_MEMORY_TOOLTIP", {"min": memory.min, "max": memory.max})
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x08})\n' +
               'sendCommand({0x08}, numberToBcd(' + value(block, 'CHANNEL') + ', 2))\n';
      }, function(block) {
        checkRange(block, 'CHANNEL', memory.min, memory.max, msg("ICOM_MEMORY_RANGE", {"min": memory.min, "max": memory.max}));
      }, {"civ": "08 (memory mode), 08 + " + String(memory.min).padStart(4, '0') + " ~ " + String(memory.max).padStart(4, '0') + " (channel)",
          "page": memory.page});
    }

    if (spec.rit)
    {
      define("Frequency & Mode", 'action', 'set_rit', {
        "message0": Blockly.Msg.ICOM_SET_RIT,
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": ON_OFF}],
        "tooltip": Blockly.Msg.ICOM_SET_RIT_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x21, 0x01}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "21 01 + 00 / 01", "page": spec.rit.page});

      define("Frequency & Mode", 'action', 'set_rit_offset', {
        "message0": Blockly.Msg.ICOM_SET_RIT_OFFSET,
        "args0": [{"type": "input_value", "name": "OFFSET", "check": "Number"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_RIT_OFFSET_TOOLTIP
      }, function(block) {
        Studio.use(['icomRitData']);
        return 'sendCommand({0x21, 0x00}, icomRitData(' + value(block, 'OFFSET') + '))\n';
      }, function(block) {
        checkRange(block, 'OFFSET', -9999, 9999, Blockly.Msg.ICOM_RIT_OFFSET_RANGE);
      }, {"civ": "21 00 + 10Hz/1Hz, 1kHz/100Hz, direction", "page": spec.rit.offsetPage});
    }

    if (spec.scan)
    {
      define("Frequency & Mode", 'action', 'scan', {
        "message0": Blockly.Msg.ICOM_SCAN,
        "args0": [{"type": "field_dropdown", "name": "SCAN", "options": termOptions(spec.scan.options)}],
        "tooltip": Blockly.Msg.ICOM_SCAN_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x0E, ' + block.getFieldValue('SCAN') + '})\n';
      }, null, {"civ": "0E + 00 (stop) / scan type", "page": spec.scan.page});
    }

    if (spec.frequency)
    {
      define("Frequency & Mode", 'property', 'get_operating_frequency', {
        "message0": Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY,
        "args0": [{"type": "field_dropdown", "name": "unit", "options": UNITS}],
        "output": "Number",
        "tooltip": Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadFrequency']);
        var unit = block.getFieldValue('unit');
        if (unit == "1")
        {
          return ['icomReadFrequency()', lua.Order.HIGH];
        }
        return ['icomReadFrequency() / ' + unit, lua.Order.MULTIPLICATIVE];
      }, null, {"civ": "03", "page": spec.frequency.page});
    }

    if (spec.modes)
    {
      define("Frequency & Mode", 'property', 'get_operating_mode', {
        "message0": Blockly.Msg.ICOM_GET_OPERATING_MODE,
        "output": "String",
        "tooltip": msg("ICOM_GET_OPERATING_MODE_TOOLTIP", {"options": optionNames(spec.modes.options, true)})
      }, function(block) {
        Studio.use(['icomName', 'icomQuery']);
        return ['icomName(icomQuery({0x04}), ' + nameTable(spec.modes.options) + ', "Unknown")', lua.Order.HIGH];
      }, null, {"civ": "04", "page": spec.modes.page});
    }

    if (spec.dataMode)
    {
      define("Frequency & Mode", 'property', 'is_data_mode', {
        "message0": Blockly.Msg.ICOM_IS_DATA_MODE,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_DATA_MODE_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadByte']);
        return ['icomReadByte({0x1A, 0x06}) ~= 0', lua.Order.RELATIONAL];
      }, null, {"civ": "1A 06 -> 00 (off) / 01 ~ 03 (on) + filter", "page": spec.dataMode.page});
    }

    if (spec.dualwatch)
    {
      define("Frequency & Mode", 'property', 'is_dualwatch', {
        "message0": Blockly.Msg.ICOM_IS_DUALWATCH,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_DUALWATCH_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x07, 0xC2})', lua.Order.HIGH];
      }, null, {"civ": "07 C2 -> 00 (off) / 01 (on)", "page": spec.dualwatch.page});
    }

    if (spec.split && spec.split.options.some(function(option) { return option[1] == "0x01"; }))
    {
      define("Frequency & Mode", 'property', 'is_split', {
        "message0": Blockly.Msg.ICOM_IS_SPLIT,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_SPLIT_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadByte']);
        return ['icomReadByte({0x0F}) == 1', lua.Order.RELATIONAL];
      }, null, {"civ": "0F -> 00 (split off) / 01 (split on)", "page": spec.split.page});
    }

    /* ------------------------------ RECEIVER ------------------------------ */

    level(spec.afLevel && Object.assign({"group": "Receiver"}, spec.afLevel), "0x01", "af_level",
          Blockly.Msg.ICOM_AF_LEVEL, Blockly.Msg.ICOM_AF_LEVEL_TEXT);
    level(spec.rfGain && Object.assign({"group": "Receiver"}, spec.rfGain), "0x02", "rf_gain",
          Blockly.Msg.ICOM_RF_GAIN, Blockly.Msg.ICOM_RF_GAIN_TEXT);
    level(spec.squelchLevel && Object.assign({"group": "Receiver"}, spec.squelchLevel), "0x03", "squelch_level",
          Blockly.Msg.ICOM_SQUELCH_LEVEL, Blockly.Msg.ICOM_SQUELCH_LEVEL_TEXT);

    // A setting with a dropdown (command 11 or 16 xx): a set block and a read block which returns the name.
    // Optional entries: group, field (name of the dropdown, VALUE), message and tooltip of the set block,
    // default (name if the answer is unknown, ""), onValue (the read block is "Is ... on?" and true for this value)
    function setting(entry, cmd, suffix, label, text)
    {
      if (!entry)
      {
        return;
      }
      var group = entry.group || "Receiver";
      var field = entry.field || 'VALUE';
      define(group, 'action', 'set_' + suffix, {
        "message0": entry.message ? term(entry.message) : msg("ICOM_SET_SETTING", {"label": label}),
        "args0": [{"type": "field_dropdown", "name": field, "options": termOptions(entry.options)}],
        "tooltip": entry.tooltip ? term(entry.tooltip) : msg("ICOM_SET_SETTING_TOOLTIP", {"text": text, "options": optionNames(entry.options)})
      }, function(block) {
        return 'sendCommand(' + cmd + ', {' + block.getFieldValue(field) + '})\n';
      }, null, {"civ": civBytes(cmd.slice(1, -1)) + " + " + entry.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": entry.page});

      if (entry.onValue)
      {
        define(group, 'property', 'is_' + suffix + '_on', {
          "message0": msg("ICOM_IS_SETTING_ON", {"label": label}),
          "output": "Boolean",
          "tooltip": msg("ICOM_IS_SETTING_ON_TOOLTIP", {"label": label, "text": text})
        }, function(block) {
          Studio.use(['icomReadByte']);
          return ['icomReadByte(' + cmd + ') == ' + entry.onValue, lua.Order.RELATIONAL];
        }, null, {"civ": civBytes(cmd.slice(1, -1)) + " -> " + entry.options.map(function(o) { return civBytes(o[1]); }).join(" / "),
                  "page": entry.page});
        return;
      }

      define(group, 'property', 'get_' + suffix, {
        "message0": label,
        "output": "String",
        "tooltip": msg("ICOM_GET_SETTING_TOOLTIP", {"text": text, "options": optionNames(entry.options, true)})
      }, function(block) {
        Studio.use(['icomName', 'icomQuery']);
        return ['icomName(icomQuery(' + cmd + '), ' + nameTable(entry.options) + ', "' + (entry.default || '') + '")', lua.Order.HIGH];
      }, null, {"civ": civBytes(cmd.slice(1, -1)) + " -> " + entry.options.map(function(o) { return civBytes(o[1]); }).join(" / "),
                "page": entry.page});
    }

    // The settings of command 16 with more than on/off (spec.choices) which belong into the group
    function choices(group)
    {
      (spec.choices ? spec.choices.options : []).forEach(function(choice) {
        if (choice.group == group)
        {
          setting(Object.assign({"page": spec.choices.page}, choice), '{0x16, ' + choice.sub + '}', choice.suffix, choice.label, choice.label);
        }
      });
    }

    setting(spec.preamp, '{0x16, 0x02}', 'preamp', Blockly.Msg.ICOM_PREAMP, Blockly.Msg.ICOM_PREAMP_TEXT);
    setting(spec.attenuator, '{0x11}', 'attenuator', Blockly.Msg.ICOM_ATTENUATOR, Blockly.Msg.ICOM_ATTENUATOR_TEXT);
    setting(spec.agc, '{0x16, 0x12}', 'agc', Blockly.Msg.ICOM_AGC, Blockly.Msg.ICOM_AGC_TEXT);

    if (spec.squelchStatus)
    {
      var squelchSub = spec.squelchStatus.sub || "0x01";
      define("Receiver", 'property', 'is_squelch_open', {
        "message0": Blockly.Msg.ICOM_IS_SQUELCH_OPEN,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_SQUELCH_OPEN_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, ' + squelchSub + '})', lua.Order.HIGH];
      }, null, {"civ": "15 " + civBytes(squelchSub) + " -> 00 (closed) / 01 (open)", "page": spec.squelchStatus.page});
    }

    choices("Receiver");

    if (spec.toneSquelchStatus)
    {
      define("Receiver", 'property', 'is_tone_squelch_open', {
        "message0": Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, 0x05})', lua.Order.HIGH];
      }, null, {"civ": "15 05 -> 00 (closed) / 01 (open)", "page": spec.toneSquelchStatus.page});
    }

    /* ------------------------------ TRANSMIT ------------------------------ */

    if (spec.transmit)
    {
      define("Transmit", 'action', 'set_transmit', {
        "message0": Blockly.Msg.ICOM_SET_TRANSMIT,
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [[Blockly.Msg.ICOM_TRANSMIT_ON, "0x01"], [Blockly.Msg.ICOM_TRANSMIT_OFF, "0x00"]]}],
        "tooltip": Blockly.Msg.ICOM_SET_TRANSMIT_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x1C, 0x00}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "1C 00 + 00 (RX) / 01 (TX)", "page": spec.transmit.page});
    }

    level(spec.rfPower && Object.assign({"group": "Transmit"}, spec.rfPower), "0x0A", "rf_power",
          Blockly.Msg.ICOM_RF_POWER, Blockly.Msg.ICOM_RF_POWER_TEXT);

    if (spec.rfPowerSteps)
    {
      var steps = spec.rfPowerSteps;
      define("Transmit", 'action', 'set_rf_power', {
        "message0": Blockly.Msg.ICOM_SET_RF_POWER_STEP,
        "args0": [{"type": "field_dropdown", "name": "POWER", "options": steps.options.map(function(o) { return [term(o[0]), String(o[1])]; })}],
        "tooltip": msg("ICOM_SET_RF_POWER_STEP_TOOLTIP", {"options": optionNames(steps.options)})
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x14, 0x0A}, numberToBcd(' + block.getFieldValue('POWER') + ', 2))\n';
      }, null, {"civ": "14 0A + " + steps.options.map(function(o) { return String(o[1]).padStart(4, '0') + " (" + o[0] + ")"; }).join(" / "),
                "page": steps.page});

      define("Transmit", 'property', 'get_rf_power', {
        "message0": Blockly.Msg.ICOM_RF_POWER,
        "output": "String",
        "tooltip": msg("ICOM_GET_RF_POWER_STEP_TOOLTIP", {"options": optionNames(steps.options, true)})
      }, function(block) {
        Studio.use(['icomReadNumber']);
        // the radio answers with a value in the range of the step
        var code = '"' + steps.options[steps.options.length - 1][0] + '"';
        for (var i = steps.options.length - 2; i >= 0; i--)
        {
          code = '(icomReadNumber({0x14, 0x0A}) <= ' + steps.options[i][2] + ' and "' + steps.options[i][0] + '" or ' + code + ')';
        }
        return [code, lua.Order.HIGH];
      }, null, {"civ": "14 0A -> " + steps.options.map(function(o, i) {
        var from = i == 0 ? 0 : steps.options[i - 1][2] + 1;
        return String(from).padStart(4, '0') + " ~ " + String(o[2]).padStart(4, '0') + " (" + o[0] + ")";
      }).join(", "), "page": steps.page});
    }

    level(spec.micGain && Object.assign({"group": "Transmit"}, spec.micGain), "0x0B", "mic_gain",
          Blockly.Msg.ICOM_MIC_GAIN, Blockly.Msg.ICOM_MIC_GAIN_TEXT);

    if (spec.tone)
    {
      define("Transmit", 'action', 'set_tone_frequency', {
        "message0": Blockly.Msg.ICOM_SET_TONE,
        "args0": [{"type": "input_value", "name": "TONE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_TONE_TOOLTIP
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x00}, numberToBcd(math.floor(' + value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
      }, function(block) {
        checkRange(block, 'TONE', 67, 254.1, Blockly.Msg.ICOM_TONE_RANGE);
      }, {"civ": "1B 00 + 3 bytes BCD in 0.1 Hz", "page": spec.tone.page});
    }

    if (spec.transmit)
    {
      define("Transmit", 'property', 'is_transmitting', {
        "message0": Blockly.Msg.ICOM_IS_TRANSMITTING,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_TRANSMITTING_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x1C, 0x00})', lua.Order.HIGH];
      }, null, {"civ": "1C 00 -> 00 (RX) / 01 (TX)", "page": spec.transmit.page});
    }

    // A level 0000 ~ 0255 (command 14 xx) which stands for a value between min and max, e.g. 300 ~ 900 Hz.
    // A set block with the input "input" and a read block. integer: the read block rounds to whole numbers
    function scaled(entry, group, sub, suffix, label, input, min, max, unit, text, integer)
    {
      if (!entry)
      {
        return;
      }
      var cmd = '{0x14, ' + sub + '}';
      var values = {"label": label, "text": text, "min": min, "max": max, "unit": unit ? " " + unit : "", "unitName": unit};
      define(group, 'action', 'set_' + suffix, {
        "message0": msg("ICOM_SET_SCALED", values),
        "args0": [{"type": "input_value", "name": input, "check": "Number"}],
        "inputsInline": true,
        "tooltip": msg("ICOM_SET_SCALED_TOOLTIP", values)
      }, function(block) {
        Studio.use(['icomLevel']);
        return 'sendCommand(' + cmd + ', icomLevel(' + value(block, input) + ', ' + min + ', ' + max + '))\n';
      }, function(block) {
        checkRange(block, input, min, max, msg("ICOM_SCALED_RANGE", values));
      }, {"civ": "14 " + civBytes(sub) + " + 0000 = " + min + " ~ 0255 = " + max + (unit ? " " + unit : ""), "page": entry.page});

      define(group, 'property', 'get_' + suffix, {
        "message0": label,
        "output": "Number",
        "tooltip": msg(unit ? "ICOM_GET_SCALED_UNIT_TOOLTIP" : "ICOM_GET_SCALED_TOOLTIP", values)
      }, function(block) {
        if (integer)
        {
          Studio.use(['icomReadNumber']);
          return ['math.floor(' + min + ' + icomReadNumber(' + cmd + ') * ' + (max - min) + ' / 255 + 0.5)', lua.Order.HIGH];
        }
        Studio.use(['icomReadLevel']);
        return ['icomReadLevel(' + cmd + ', ' + min + ', ' + max + ')', lua.Order.HIGH];
      }, null, {"civ": "14 " + civBytes(sub) + " -> 0000 = " + min + " ~ 0255 = " + max + (unit ? " " + unit : ""), "page": entry.page});
    }

    choices("Transmit");
    scaled(spec.compLevel, "Transmit", "0x0E", "comp_level", Blockly.Msg.ICOM_COMP_LEVEL, "LEVEL", 0, 10, "",
           Blockly.Msg.ICOM_COMP_LEVEL_TEXT);

    if (spec.tsql)
    {
      define("Transmit", 'action', 'set_tsql_frequency', {
        "message0": Blockly.Msg.ICOM_SET_TSQL,
        "args0": [{"type": "input_value", "name": "TONE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_TSQL_TOOLTIP
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x01}, numberToBcd(math.floor(' + value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
      }, function(block) {
        checkRange(block, 'TONE', 67, 254.1, Blockly.Msg.ICOM_TSQL_RANGE);
      }, {"civ": "1B 01 + 3 bytes BCD in 0.1 Hz", "page": spec.tsql.page});
    }

    if (spec.dtcs)
    {
      define("Transmit", 'action', 'set_dtcs_code', {
        "message0": Blockly.Msg.ICOM_SET_DTCS,
        "args0": [
          {"type": "input_value", "name": "CODE", "check": "Number"},
          {
            "type": "field_dropdown",
            "name": "POLARITY",
            "options": [[Blockly.Msg.ICOM_DTCS_NORMAL, "0x00"], [Blockly.Msg.ICOM_DTCS_TX_REVERSE, "0x10"],
                        [Blockly.Msg.ICOM_DTCS_RX_REVERSE, "0x01"], [Blockly.Msg.ICOM_DTCS_BOTH_REVERSE, "0x11"]]
          }
        ],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_DTCS_TOOLTIP
      }, function(block) {
        Studio.use(['icomDtcsData']);
        return 'sendCommand({0x1B, 0x02}, icomDtcsData(' + value(block, 'CODE') + ', ' + block.getFieldValue('POLARITY') + '))\n';
      }, function(block) {
        var input = block.getInputTargetBlock('CODE');
        var code = (input && input.type == 'math_number') ? input.getFieldValue('NUM') : null;
        block.setWarningText(code !== null && !/^[0-7]{1,3}$/.test(code) ? Blockly.Msg.ICOM_DTCS_INVALID : null);
      }, {"civ": "1B 02 + polarity, 0 + first digit, second + third digit", "page": spec.dtcs.page});

      define("Transmit", 'property', 'get_dtcs_code', {
        "message0": Blockly.Msg.ICOM_GET_DTCS,
        "output": "Number",
        "tooltip": Blockly.Msg.ICOM_GET_DTCS_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadDtcs']);
        return ['icomReadDtcs()', lua.Order.HIGH];
      }, null, {"civ": "1B 02 -> polarity, 0 + first digit, second + third digit", "page": spec.dtcs.page});
    }

    if (spec.csql)
    {
      define("Transmit", 'action', 'set_csql_code', {
        "message0": Blockly.Msg.ICOM_SET_CSQL,
        "args0": [{"type": "input_value", "name": "CODE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_CSQL_TOOLTIP
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x07}, numberToBcd(' + value(block, 'CODE') + ', 1))\n';
      }, function(block) {
        checkRange(block, 'CODE', 0, 99, Blockly.Msg.ICOM_CSQL_RANGE);
      }, {"civ": "1B 07 + 00 ~ 99", "page": spec.csql.page});
    }

    /* ------------------------------ METERS ------------------------------ */

    if (spec.sMeter)
    {
      var s = spec.sMeter;
      var units = s.plus60 ? [[Blockly.Msg.ICOM_S_UNITS, "S"], [Blockly.Msg.ICOM_DB_OVER_S9, "DB"]] : [[Blockly.Msg.ICOM_S_UNITS, "S"]];
      define("Meters", 'property', 'get_s_meter', {
        "message0": Blockly.Msg.ICOM_S_METER,
        "args0": [{"type": "field_dropdown", "name": "UNIT", "options": units}],
        "output": "Number",
        "tooltip": s.plus60 ? Blockly.Msg.ICOM_S_METER_DB_TOOLTIP : Blockly.Msg.ICOM_S_METER_TOOLTIP
      }, function(block) {
        Studio.use(['icomMeter']);
        if (block.getFieldValue('UNIT') == 'DB')
        {
          return ['icomMeter({0x15, 0x02}, {{0, -54}, {' + s.s9 + ', 0}, {' + s.plus60 + ', 60}})', lua.Order.HIGH];
        }
        return ['math.min(9, icomMeter({0x15, 0x02}, {{0, 0}, {' + s.s9 + ', 9}}))', lua.Order.HIGH];
      }, null, {"civ": "15 02 -> 0000 = S0, " + String(s.s9).padStart(4, '0') + " = S9" +
                       (s.plus60 ? ", " + String(s.plus60).padStart(4, '0') + " = S9+60 dB" : ""), "page": s.page});
    }

    meter(spec.swr, "0x12", "get_swr_meter_level", Blockly.Msg.ICOM_SWR, "", Blockly.Msg.ICOM_SWR_TOOLTIP);
    if (spec.powerOutput)
    {
      var watts = spec.powerOutput.unit == "W";
      meter(spec.powerOutput, "0x11", "get_power_output", Blockly.Msg.ICOM_POWER_OUTPUT, watts ? " W" : " %",
            watts ? Blockly.Msg.ICOM_POWER_OUTPUT_W_TOOLTIP : Blockly.Msg.ICOM_POWER_OUTPUT_PERCENT_TOOLTIP);
    }
    meter(spec.alc, "0x13", "get_alc", Blockly.Msg.ICOM_ALC, " %", Blockly.Msg.ICOM_ALC_TOOLTIP);
    meter(spec.voltage, "0x15", "get_supply_voltage", Blockly.Msg.ICOM_SUPPLY_VOLTAGE, " V", Blockly.Msg.ICOM_SUPPLY_VOLTAGE_TOOLTIP);
    meter(spec.current, "0x16", "get_supply_current", Blockly.Msg.ICOM_SUPPLY_CURRENT, " A", Blockly.Msg.ICOM_SUPPLY_CURRENT_TOOLTIP);

    if (spec.battery)
    {
      define("Meters", 'property', 'is_on_battery', {
        "message0": Blockly.Msg.ICOM_IS_ON_BATTERY,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_ON_BATTERY_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x1A, 0x0B})', lua.Order.HIGH];
      }, null, {"civ": "1A 0B -> 00 (external power supply) / 01 (battery pack)", "page": spec.battery.page});
    }

    if (spec.overflow)
    {
      define("Meters", 'property', 'is_overflow', {
        "message0": Blockly.Msg.ICOM_IS_OVERFLOW,
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_OVERFLOW_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, 0x07})', lua.Order.HIGH];
      }, null, {"civ": "15 07 -> 00 (OVF off) / 01 (OVF on)", "page": spec.overflow.page});
    }

    meter(spec.compMeter, "0x14", "get_comp_meter", Blockly.Msg.ICOM_COMPRESSION, " dB", Blockly.Msg.ICOM_COMPRESSION_TOOLTIP);

    /* ------------------------------ CW & VOICE ------------------------------ */

    if (spec.cw)
    {
      define("CW & Voice", 'action', 'send_cw', {
        "message0": Blockly.Msg.ICOM_SEND_CW,
        "args0": [{"type": "input_value", "name": "TEXT"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SEND_CW_TOOLTIP
      }, function(block) {
        Studio.use(['icomTextBytes']);
        var text = Blockly.Lua.valueToCode(block, 'TEXT', lua.Order.NONE) || "''";
        return 'sendCommand({0x17}, icomTextBytes(' + text + '))\n';
      }, null, {"civ": "17 + ASCII codes", "page": spec.cw.page});
    }

    if (spec.keyingSpeed)
    {
      define("CW & Voice", 'action', 'set_keying_speed', {
        "message0": Blockly.Msg.ICOM_SET_KEYING_SPEED,
        "args0": [{"type": "input_value", "name": "WPM", "check": "Number"}],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_KEYING_SPEED_TOOLTIP
      }, function(block) {
        Studio.use(['icomWpm']);
        return 'sendCommand({0x14, 0x0C}, icomWpm(' + value(block, 'WPM') + '))\n';
      }, function(block) {
        checkRange(block, 'WPM', 6, 48, Blockly.Msg.ICOM_KEYING_SPEED_RANGE);
      }, {"civ": "14 0C + 0000 = 6 WPM ~ 0255 = 48 WPM", "page": spec.keyingSpeed.page});
    }

    if (spec.voiceMemory)
    {
      define("CW & Voice", 'action', 'play_voice_memory', {
        "message0": Blockly.Msg.ICOM_PLAY_VOICE_MEMORY,
        "args0": [{
          "type": "field_dropdown",
          "name": "MEMORY",
          "options": [["T1", "0x01"], ["T2", "0x02"], ["T3", "0x03"], ["T4", "0x04"], ["T5", "0x05"],
                      ["T6", "0x06"], ["T7", "0x07"], ["T8", "0x08"], [Blockly.Msg.ICOM_STOP, "0x00"]]
        }],
        "tooltip": Blockly.Msg.ICOM_PLAY_VOICE_MEMORY_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x28, 0x00}, {' + block.getFieldValue('MEMORY') + '})\n';
      }, null, {"civ": "28 00 + 01 ~ 08 (T1 ~ T8) / 00 (stop)", "page": spec.voiceMemory.page});
    }

    if (spec.announce)
    {
      define("CW & Voice", 'action', 'announce', {
        "message0": Blockly.Msg.ICOM_ANNOUNCE,
        "args0": [{
          "type": "field_dropdown",
          "name": "WHAT",
          "options": [[Blockly.Msg.ICOM_ANNOUNCE_ALL, "0x00"], [Blockly.Msg.ICOM_ANNOUNCE_FREQUENCY, "0x01"],
                      [Blockly.Msg.ICOM_ANNOUNCE_MODE, "0x02"]]
        }],
        "tooltip": Blockly.Msg.ICOM_ANNOUNCE_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x13, ' + block.getFieldValue('WHAT') + '})\n';
      }, null, {"civ": "13 00 / 01 / 02", "page": spec.announce.page});
    }

    if (spec.keyingSpeed)
    {
      define("CW & Voice", 'property', 'get_keying_speed', {
        "message0": Blockly.Msg.ICOM_GET_KEYING_SPEED,
        "output": "Number",
        "tooltip": Blockly.Msg.ICOM_GET_KEYING_SPEED_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadNumber']);
        return ['math.floor(6 + icomReadNumber({0x14, 0x0C}) * 42 / 255 + 0.5)', lua.Order.HIGH];
      }, null, {"civ": "14 0C -> 0000 = 6 WPM ~ 0255 = 48 WPM", "page": spec.keyingSpeed.page});
    }

    choices("CW & Voice");
    scaled(spec.cwPitch, "CW & Voice", "0x09", "cw_pitch", Blockly.Msg.ICOM_CW_PITCH, "PITCH", 300, 900, "Hz",
           Blockly.Msg.ICOM_CW_PITCH_TEXT, true);
    scaled(spec.breakInDelay, "CW & Voice", "0x0F", "break_in_delay", Blockly.Msg.ICOM_BREAK_IN_DELAY, "DELAY", 2, 13, Blockly.Msg.ICOM_DOTS,
           Blockly.Msg.ICOM_BREAK_IN_DELAY_TEXT);

    /* ------------------------------ GPS & TIME ------------------------------ */

    if (spec.position)
    {
      define("GPS & Time", 'property', 'get_gps_position', {
        "message0": msg("ICOM_GET_POSITION", {"label": spec.position.label ? term(spec.position.label) : Blockly.Msg.ICOM_POSITION}),
        "args0": [{
          "type": "field_dropdown",
          "name": "VALUE",
          "options": [[Blockly.Msg.ICOM_LATITUDE, "lat"], [Blockly.Msg.ICOM_LONGITUDE, "lon"], [Blockly.Msg.ICOM_ALTITUDE, "alt"],
                      [Blockly.Msg.ICOM_COURSE, "course"], [Blockly.Msg.ICOM_SPEED, "speed"]]
        }],
        "output": "Number",
        "tooltip": msg("ICOM_GET_POSITION_TOOLTIP", {"text": term(spec.position.text)})
      }, function(block) {
        Studio.use(['icomGpsValue']);
        return ['icomGpsValue("' + block.getFieldValue('VALUE') + '")', lua.Order.HIGH];
      }, null, {"civ": "23 00", "page": spec.position.page});

      define("GPS & Time", 'property', 'get_gps_time', {
        "message0": Blockly.Msg.ICOM_GET_GPS_TIME,
        "args0": [{
          "type": "field_dropdown",
          "name": "PART",
          "options": [[Blockly.Msg.ICOM_AS_TEXT, "text"], [Blockly.Msg.ICOM_UNIX_TIME, "unix"], [Blockly.Msg.ICOM_YEAR, "year"],
                      [Blockly.Msg.ICOM_MONTH, "month"], [Blockly.Msg.ICOM_DAY, "day"], [Blockly.Msg.ICOM_HOUR, "hour"],
                      [Blockly.Msg.ICOM_MINUTE, "minute"], [Blockly.Msg.ICOM_SECOND, "second"]]
        }],
        "output": null,
        "tooltip": Blockly.Msg.ICOM_GET_GPS_TIME_TOOLTIP
      }, function(block) {
        Studio.use(['icomGpsTime']);
        return ['icomGpsTime("' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
      }, null, {"civ": "23 00, date and time in UTC", "page": spec.position.page});
    }

    if (spec.clock)
    {
      var clock = spec.clock;
      define("GPS & Time", 'property', 'get_clock', {
        "message0": Blockly.Msg.ICOM_GET_CLOCK,
        "args0": [{
          "type": "field_dropdown",
          "name": "PART",
          "options": [[Blockly.Msg.ICOM_TIME_AS_TEXT, "time"], [Blockly.Msg.ICOM_DATE_AS_TEXT, "date"], [Blockly.Msg.ICOM_YEAR, "year"],
                      [Blockly.Msg.ICOM_MONTH, "month"], [Blockly.Msg.ICOM_DAY, "day"], [Blockly.Msg.ICOM_HOUR, "hour"],
                      [Blockly.Msg.ICOM_MINUTE, "minute"]]
        }],
        "output": null,
        "tooltip": Blockly.Msg.ICOM_GET_CLOCK_TOOLTIP
      }, function(block) {
        Studio.use(['icomClock']);
        return ['icomClock({0x1A, 0x05, ' + clock.date + '}, {0x1A, 0x05, ' + clock.time + '}, "' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
      }, null, {"civ": "1A 05 " + civBytes(clock.date) + " (date) and 1A 05 " + civBytes(clock.time) + " (time)", "page": clock.page});
    }

    if (spec.position)
    {
      define("GPS & Time", 'helper', 'locator', {
        "message0": Blockly.Msg.ICOM_LOCATOR,
        "args0": [
          {"type": "input_value", "name": "LAT", "check": "Number"},
          {"type": "input_value", "name": "LON", "check": "Number"}
        ],
        "inputsInline": true,
        "output": "String",
        "tooltip": Blockly.Msg.ICOM_LOCATOR_TOOLTIP
      }, function(block) {
        Studio.use(['icomLocator']);
        return ['icomLocator(' + value(block, 'LAT') + ', ' + value(block, 'LON') + ')', lua.Order.HIGH];
      }, null, null);
    }

    choices("GPS & Time");

    /* ------------------------------ SETTINGS ------------------------------ */

    if (spec.functions)
    {
      var functions = spec.functions.options;
      define("Settings", 'action', 'switch_function', {
        "message0": Blockly.Msg.ICOM_SWITCH_FUNCTION,
        "args0": [
          {"type": "field_dropdown", "name": "FUNCTION", "options": termOptions(functions)},
          {"type": "field_dropdown", "name": "STATE", "options": ON_OFF}
        ],
        "tooltip": Blockly.Msg.ICOM_SWITCH_FUNCTION_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x16, ' + block.getFieldValue('FUNCTION') + '}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "16 xx + 00 (off) / 01 (on)", "page": spec.functions.page});
    }

    level(spec.brightness && Object.assign({"group": "Settings"}, spec.brightness), "0x19", "lcd_brightness",
          Blockly.Msg.ICOM_LCD_BRIGHTNESS, Blockly.Msg.ICOM_LCD_BRIGHTNESS_TEXT);

    if (spec.power)
    {
      define("Settings", 'action', 'set_power', {
        "message0": Blockly.Msg.ICOM_SET_POWER,
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [[Blockly.Msg.ICOM_OFF, "0x00"], [Blockly.Msg.ICOM_ON, "0x01"]]}],
        "tooltip": Blockly.Msg.ICOM_SET_POWER_TOOLTIP
      }, function(block) {
        return 'sendCommand({0x18, ' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "18 00 (off) / 18 01 (on)", "page": spec.power.page});
    }

    if (spec.functions)
    {
      define("Settings", 'property', 'is_function_on', {
        "message0": Blockly.Msg.ICOM_IS_FUNCTION_ON,
        "args0": [{"type": "field_dropdown", "name": "FUNCTION", "options": termOptions(spec.functions.options)}],
        "output": "Boolean",
        "tooltip": Blockly.Msg.ICOM_IS_FUNCTION_ON_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadByte']);
        return ['icomReadByte({0x16, ' + block.getFieldValue('FUNCTION') + '}) ~= 0', lua.Order.RELATIONAL];
      }, null, {"civ": "16 xx -> 00 (off) / 01 (on)", "page": spec.functions.page});
    }

    // More levels 0 ~ 100 % of command 14 in one block with a dropdown (e.g. NR level, VOX gain)
    if (spec.levels)
    {
      var levels = spec.levels.options;
      define("Settings", 'action', 'set_level', {
        "message0": Blockly.Msg.ICOM_SET_LEVEL_OF,
        "args0": [
          {"type": "field_dropdown", "name": "LEVEL", "options": termOptions(levels)},
          {"type": "input_value", "name": "VALUE", "check": "Number"}
        ],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_LEVEL_OF_TOOLTIP
      }, function(block) {
        Studio.use(['icomPercent']);
        return 'sendCommand({0x14, ' + block.getFieldValue('LEVEL') + '}, icomPercent(' + value(block, 'VALUE') + '))\n';
      }, function(block) {
        checkRange(block, 'VALUE', 0, 100, Blockly.Msg.ICOM_LEVEL_OF_RANGE);
      }, {"civ": "14 + " + levels.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / ") + " + 0000 ~ 0255",
          "page": spec.levels.page});

      define("Settings", 'property', 'get_level', {
        "message0": "%1",
        "args0": [{"type": "field_dropdown", "name": "LEVEL", "options": termOptions(levels)}],
        "output": "Number",
        "tooltip": Blockly.Msg.ICOM_GET_LEVEL_OF_TOOLTIP
      }, function(block) {
        Studio.use(['icomReadPercent']);
        return ['icomReadPercent({0x14, ' + block.getFieldValue('LEVEL') + '})', lua.Order.HIGH];
      }, null, {"civ": "14 xx -> 0000 ~ 0255", "page": spec.levels.page});
    }

    // Any setting of the menu, by the number of the setting in the CI-V reference guide
    if (spec.menu)
    {
      define("Settings", 'action', 'set_menu', {
        "message0": Blockly.Msg.ICOM_SET_MENU,
        "args0": [
          {"type": "input_value", "name": "ITEM", "check": "Number"},
          {"type": "input_value", "name": "VALUE", "check": "Number"},
          {"type": "field_dropdown", "name": "BYTES", "options": [[Blockly.Msg.ICOM_MENU_1_BYTE, "1"], [Blockly.Msg.ICOM_MENU_2_BYTES, "2"]]}
        ],
        "inputsInline": true,
        "tooltip": Blockly.Msg.ICOM_SET_MENU_TOOLTIP
      }, function(block) {
        Studio.use(['icomMenuCmd', 'numberToBcd']);
        return 'sendCommand(icomMenuCmd(' + value(block, 'ITEM') + '), numberToBcd(' + value(block, 'VALUE') + ', ' +
               block.getFieldValue('BYTES') + '))\n';
      }, function(block) {
        checkRange(block, 'ITEM', 1, 9999, Blockly.Msg.ICOM_MENU_RANGE);
      }, {"civ": "1A 05 + number of the setting (2 bytes BCD) + value (BCD)", "page": spec.menu.page});

      define("Settings", 'property', 'get_menu', {
        "message0": Blockly.Msg.ICOM_GET_MENU,
        "args0": [{"type": "input_value", "name": "ITEM", "check": "Number"}],
        "inputsInline": true,
        "output": "Number",
        "tooltip": Blockly.Msg.ICOM_GET_MENU_TOOLTIP
      }, function(block) {
        Studio.use(['icomMenuCmd', 'icomReadNumber']);
        return ['icomReadNumber(icomMenuCmd(' + value(block, 'ITEM') + '))', lua.Order.HIGH];
      }, function(block) {
        checkRange(block, 'ITEM', 1, 9999, Blockly.Msg.ICOM_MENU_RANGE);
      }, {"civ": "1A 05 + number of the setting (2 bytes BCD) -> value (BCD)", "page": spec.menu.page});
    }

    // Register the groups in the toolbox, in the usual order. Within a group: actions, properties, helpers
    GROUPS.forEach(function(name) {
      if (!groups[name])
      {
        return;
      }
      var handle = category.group(GROUP_NAMES[name]);
      groups[name].blocks.forEach(function(block) {
        handle[block.kind](block.type);
      });
    });
  }

  return {
    "radio": radio,
    "radios": radios,
  };
})();

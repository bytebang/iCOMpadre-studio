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
// used in the documentation of the blocks (documentation/blocks/radio/<prefix>.md).
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

/**
 * Creates the blocks of Icom radios. The only global this file adds.
 * @namespace
 */
var Icom = (function() {

  var ON_OFF = [["on", "0x01"], ["off", "0x00"]];
  var UNITS = [["Hz", "1"], ["kHz", "1e3"], ["MHz", "1e6"]];

  // The groups of a radio category, in the order of the toolbox (the same as for the IC-705)
  var GROUPS = ["Frequency & Mode", "Receiver", "Transmit", "Meters", "CW & Voice", "GPS & Time", "Settings"];

  // The usual settings of command 16 with more than on/off. A radio lists the ones it has in spec.choices by name.
  var CHOICES = {
    "dsp_filter_type": {"label": "DSP Filter Type", "sub": "0x56", "group": "Receiver",
                        "options": [["SHARP", "0x00"], ["SOFT", "0x01"]], "tooltip": "Sets the shape of the DSP IF filter in the operating band"},
    "notch_width": {"label": "Manual Notch Width", "sub": "0x57", "group": "Receiver",
                    "options": [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]], "tooltip": "Sets the width of the manual notch filter"},
    "digital_squelch": {"label": "Digital Squelch", "sub": "0x5B", "group": "Receiver",
                        "options": [["OFF", "0x00"], ["DSQL", "0x01"], ["CSQL", "0x02"]],
                        "tooltip": "Sets the digital call sign squelch (DSQL) or the digital code squelch (CSQL). DV mode only"},
    "tone_function": {"label": "Tone Function", "sub": "0x5D", "group": "Transmit",
                      "options": [["OFF", "0x00"], ["TONE", "0x01"], ["TSQL", "0x02"], ["DTCS", "0x03"], ["DTCS(T)", "0x06"],
                                  ["TONE(T)/DTCS(R)", "0x07"], ["DTCS(T)/TSQL(R)", "0x08"], ["TONE(T)/TSQL(R)", "0x09"]],
                      "tooltip": "Selects the repeater tone, tone squelch or DTCS function (FM mode)"},
    "ssb_tx_bandwidth": {"label": "SSB TX Bandwidth", "sub": "0x58", "group": "Transmit",
                         "options": [["WIDE", "0x00"], ["MID", "0x01"], ["NAR", "0x02"]], "tooltip": "Selects the SSB transmit bandwidth"},
    "break_in": {"label": "Break-In", "sub": "0x47", "group": "CW & Voice",
                 "options": [["OFF", "0x00"], ["semi", "0x01"], ["full", "0x02"]], "tooltip": "Sets the CW break-in function: off, semi or full break-in"},
    "gps_tx_mode": {"label": "GPS TX Mode", "sub": "0x5C", "group": "GPS & Time",
                    "options": [["OFF", "0x00"], ["D-PRS", "0x01"], ["NMEA", "0x02"]], "tooltip": "Selects which position data is transmitted in DV mode"}
  };

  // The usual levels 0 ~ 100 % of command 14 for the block "Set Level". A radio lists the ones it has in spec.levels by name.
  var LEVELS = {
    "nr": ["NR level", "0x06"], "nb": ["NB level", "0x12"], "pbt1": ["inner PBT (PBT1)", "0x07"], "pbt2": ["outer PBT (PBT2)", "0x08"],
    "notch": ["manual notch position", "0x0D"], "monitor": ["monitor level", "0x15"], "vox": ["VOX gain", "0x16"], "antivox": ["anti-VOX gain", "0x17"]
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

  // Names of the options, e.g. "LSB, USB or AM"
  function optionNames(options)
  {
    var names = options.map(function(option) { return option[0]; });
    return names.length > 1 ? names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1] : names.join('');
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
        "message0": "Set " + label + " to %1 %%",
        "args0": [{"type": "input_value", "name": input, "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the " + text + " (in %)"
      }, function(block) {
        Studio.use(['icomPercent']);
        return 'sendCommand(' + cmd + ', icomPercent(' + value(block, input) + '))\n';
      }, function(block) {
        checkRange(block, input, 0, 100, label + " must be between 0 and 100%");
      }, {"civ": "14 " + civBytes(sub) + " + 0000 ~ 0255", "page": entry.page});

      define(entry.group, 'property', 'get_' + suffix, {
        "message0": label,
        "output": "Number",
        "tooltip": "Reads the " + text + " (in %)"
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
        "message0": "Set Frequency to %1 %2",
        "args0": [
          {"type": "input_value", "name": "FREQUENCY", "check": "Number"},
          {"type": "field_dropdown", "name": "UNIT", "options": UNITS}
        ],
        "inputsInline": true,
        "tooltip": "Sets the frequency of the radio"
      }, function(block) {
        var frequency = value(block, 'FREQUENCY', lua.Order.MULTIPLICATIVE);
        Studio.use(['frequencyToBcd']);
        return 'sendCommand({0x05}, frequencyToBcd(' + frequency + ' * ' + block.getFieldValue('UNIT') + ', 5))\n';
      }, null, {"civ": "05 + 5 bytes BCD, least significant byte first", "page": spec.frequency.page});
    }

    if (spec.modes)
    {
      define("Frequency & Mode", 'action', 'set_operating_mode', {
        "message0": "Set Operating Mode to %1",
        "args0": [{"type": "field_dropdown", "name": "MODE", "options": spec.modes.options}],
        "inputsInline": true,
        "tooltip": "Sets the operating mode of the radio"
      }, function(block) {
        return 'sendCommand({0x06}, {' + block.getFieldValue('MODE') + '})\n';
      }, null, {"civ": "06 + mode", "page": spec.modes.page});
    }

    if (spec.dataMode)
    {
      define("Frequency & Mode", 'action', 'set_data_mode', {
        "message0": "Data Mode %1",
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [["on", "{0x01, 0x01}"], ["off", "{0x00, 0x00}"]]}],
        "tooltip": "Switches the data mode (e.g. USB-D for digital modes like FT8) on or off"
      }, function(block) {
        return 'sendCommand({0x1A, 0x06}, ' + block.getFieldValue('STATE') + ')\n';
      }, null, {"civ": "1A 06 + 01 01 (on, FIL1) / 00 00 (off)", "page": spec.dataMode.page});
    }

    if (spec.tuningSteps)
    {
      define("Frequency & Mode", 'action', 'set_tuning_step', {
        "message0": "Set Tuning Step to %1",
        "args0": [{"type": "field_dropdown", "name": "STEP", "options": spec.tuningSteps.options}],
        "inputsInline": true,
        "tooltip": "Sets the tuning step of the radio"
      }, function(block) {
        return 'sendCommand({0x10, ' + block.getFieldValue('STEP') + '})\n';
      }, null, {"civ": "10 + step", "page": spec.tuningSteps.page});
    }

    // One block per VFO (e.g. "Select VFO A"), if the options have a third entry: the suffix of the block type
    if (spec.vfo && spec.vfo.separate)
    {
      spec.vfo.options.forEach(function(option) {
        define("Frequency & Mode", 'action', 'select_vfo_' + option[2], {
          "message0": "Select " + option[0],
          "tooltip": "Selects " + option[0]
        }, function(block) {
          return 'sendCommand({0x07, ' + option[1] + '})\n';
        }, null, {"civ": "07 " + civBytes(option[1]), "page": spec.vfo.page});
      });
    }
    else if (spec.vfo)
    {
      define("Frequency & Mode", 'action', 'select_vfo', {
        "message0": "Select %1",
        "args0": [{"type": "field_dropdown", "name": "VFO", "options": spec.vfo.options}],
        "tooltip": "Selects " + optionNames(spec.vfo.options)
      }, function(block) {
        return 'sendCommand({0x07, ' + block.getFieldValue('VFO') + '})\n';
      }, null, {"civ": "07 + " + spec.vfo.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": spec.vfo.page});
    }

    if (spec.equalize)
    {
      define("Frequency & Mode", 'action', 'equalize_vfo', {
        "message0": "Equalize " + spec.equalize.what,
        "tooltip": "Copies the frequency and mode of the selected one to the other one (" + spec.equalize.what + ")"
      }, function(block) {
        return 'sendCommand({0x07, ' + spec.equalize.code + '})\n';
      }, null, {"civ": "07 " + civBytes(spec.equalize.code), "page": spec.equalize.page});
    }

    if (spec.exchange)
    {
      define("Frequency & Mode", 'action', 'exchange_vfo', {
        "message0": "Exchange " + spec.exchange.what,
        "tooltip": "Exchanges the frequency and mode of the " + spec.exchange.what
      }, function(block) {
        return 'sendCommand({0x07, ' + spec.exchange.code + '})\n';
      }, null, {"civ": "07 " + civBytes(spec.exchange.code), "page": spec.exchange.page});
    }

    if (spec.dualwatch)
    {
      define("Frequency & Mode", 'action', 'set_dualwatch', {
        "message0": "Dualwatch %1",
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [["on", "0xC1"], ["off", "0xC0"]]}],
        "tooltip": "Switches the dualwatch (receiving on the main and the sub band) on or off"
      }, function(block) {
        return 'sendCommand({0x07, ' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "07 C1 (on) / 07 C0 (off)", "page": spec.dualwatch.page});
    }

    if (spec.split)
    {
      define("Frequency & Mode", 'action', 'set_split', {
        "message0": "Set %1",
        "args0": [{"type": "field_dropdown", "name": "SPLIT", "options": spec.split.options}],
        "tooltip": "Selects " + optionNames(spec.split.options)
      }, function(block) {
        return 'sendCommand({0x0F, ' + block.getFieldValue('SPLIT') + '})\n';
      }, null, {"civ": "0F + " + spec.split.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": spec.split.page});
    }

    if (spec.memory)
    {
      var memory = spec.memory;
      define("Frequency & Mode", 'action', 'select_memory', {
        "message0": "Select Memory Channel %1",
        "args0": [{"type": "input_value", "name": "CHANNEL", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Switches to the memory mode and selects the memory channel (" + memory.min + " ~ " + memory.max + ")"
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x08})\n' +
               'sendCommand({0x08}, numberToBcd(' + value(block, 'CHANNEL') + ', 2))\n';
      }, function(block) {
        checkRange(block, 'CHANNEL', memory.min, memory.max,
                   "The memory channel must be between " + memory.min + " and " + memory.max);
      }, {"civ": "08 (memory mode), 08 + " + String(memory.min).padStart(4, '0') + " ~ " + String(memory.max).padStart(4, '0') + " (channel)",
          "page": memory.page});
    }

    if (spec.rit)
    {
      define("Frequency & Mode", 'action', 'set_rit', {
        "message0": "RIT %1",
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": ON_OFF}],
        "tooltip": "Switches the RIT (receive incremental tuning) on or off"
      }, function(block) {
        return 'sendCommand({0x21, 0x01}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "21 01 + 00 / 01", "page": spec.rit.page});

      define("Frequency & Mode", 'action', 'set_rit_offset', {
        "message0": "Set RIT offset to %1 Hz",
        "args0": [{"type": "input_value", "name": "OFFSET", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the RIT offset (-9999 ~ +9999 Hz)"
      }, function(block) {
        Studio.use(['icomRitData']);
        return 'sendCommand({0x21, 0x00}, icomRitData(' + value(block, 'OFFSET') + '))\n';
      }, function(block) {
        checkRange(block, 'OFFSET', -9999, 9999, "The RIT offset must be between -9999 and +9999 Hz");
      }, {"civ": "21 00 + 10Hz/1Hz, 1kHz/100Hz, direction", "page": spec.rit.offsetPage});
    }

    if (spec.scan)
    {
      define("Frequency & Mode", 'action', 'scan', {
        "message0": "Scan %1",
        "args0": [{"type": "field_dropdown", "name": "SCAN", "options": spec.scan.options}],
        "tooltip": "Starts a scan of the selected type, or stops it"
      }, function(block) {
        return 'sendCommand({0x0E, ' + block.getFieldValue('SCAN') + '})\n';
      }, null, {"civ": "0E + 00 (stop) / scan type", "page": spec.scan.page});
    }

    if (spec.frequency)
    {
      define("Frequency & Mode", 'property', 'get_operating_frequency', {
        "message0": "operating frequency in %1",
        "args0": [{"type": "field_dropdown", "name": "unit", "options": UNITS}],
        "output": "Number",
        "tooltip": "Reads the current frequency of the radio"
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
        "message0": "Operating Mode",
        "output": "String",
        "tooltip": "Reads the current operating mode of the radio (" + optionNames(spec.modes.options) + ")"
      }, function(block) {
        Studio.use(['icomName', 'icomQuery']);
        return ['icomName(icomQuery({0x04}), ' + nameTable(spec.modes.options) + ', "Unknown")', lua.Order.HIGH];
      }, null, {"civ": "04", "page": spec.modes.page});
    }

    if (spec.dataMode)
    {
      define("Frequency & Mode", 'property', 'is_data_mode', {
        "message0": "Is Data Mode on?",
        "output": "Boolean",
        "tooltip": "True if the data mode (e.g. USB-D) is on"
      }, function(block) {
        Studio.use(['icomReadByte']);
        return ['icomReadByte({0x1A, 0x06}) ~= 0', lua.Order.RELATIONAL];
      }, null, {"civ": "1A 06 -> 00 (off) / 01 ~ 03 (on) + filter", "page": spec.dataMode.page});
    }

    if (spec.dualwatch)
    {
      define("Frequency & Mode", 'property', 'is_dualwatch', {
        "message0": "Is Dualwatch on?",
        "output": "Boolean",
        "tooltip": "True if the dualwatch is on"
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x07, 0xC2})', lua.Order.HIGH];
      }, null, {"civ": "07 C2 -> 00 (off) / 01 (on)", "page": spec.dualwatch.page});
    }

    if (spec.split && spec.split.options.some(function(option) { return option[1] == "0x01"; }))
    {
      define("Frequency & Mode", 'property', 'is_split', {
        "message0": "Is Split on?",
        "output": "Boolean",
        "tooltip": "True if the split function is on"
      }, function(block) {
        Studio.use(['icomReadByte']);
        return ['icomReadByte({0x0F}) == 1', lua.Order.RELATIONAL];
      }, null, {"civ": "0F -> 00 (split off) / 01 (split on)", "page": spec.split.page});
    }

    /* ------------------------------ RECEIVER ------------------------------ */

    level(spec.afLevel && Object.assign({"group": "Receiver"}, spec.afLevel), "0x01", "af_level", "AF Level", "AF output level (volume)");
    level(spec.rfGain && Object.assign({"group": "Receiver"}, spec.rfGain), "0x02", "rf_gain", "RF Gain", "RF gain");
    level(spec.squelchLevel && Object.assign({"group": "Receiver"}, spec.squelchLevel), "0x03", "squelch_level", "Squelch Level", "squelch level");

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
        "message0": entry.message || "Set " + label + " to %1",
        "args0": [{"type": "field_dropdown", "name": field, "options": entry.options}],
        "tooltip": entry.tooltip || "Sets the " + text + ": " + optionNames(entry.options)
      }, function(block) {
        return 'sendCommand(' + cmd + ', {' + block.getFieldValue(field) + '})\n';
      }, null, {"civ": civBytes(cmd.slice(1, -1)) + " + " + entry.options.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / "),
                "page": entry.page});

      if (entry.onValue)
      {
        define(group, 'property', 'is_' + suffix + '_on', {
          "message0": "Is " + label + " on?",
          "output": "Boolean",
          "tooltip": "True if the " + text + " is on"
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
        "tooltip": "Reads the " + text + ": " + optionNames(entry.options)
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

    setting(spec.preamp, '{0x16, 0x02}', 'preamp', 'Preamp', 'preamplifier');
    setting(spec.attenuator, '{0x11}', 'attenuator', 'Attenuator', 'attenuator');
    setting(spec.agc, '{0x16, 0x12}', 'agc', 'AGC', 'AGC time constant');

    if (spec.squelchStatus)
    {
      var squelchSub = spec.squelchStatus.sub || "0x01";
      define("Receiver", 'property', 'is_squelch_open', {
        "message0": "Is Squelch open?",
        "output": "Boolean",
        "tooltip": "True if the squelch is open, i.e. a signal is received"
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, ' + squelchSub + '})', lua.Order.HIGH];
      }, null, {"civ": "15 " + civBytes(squelchSub) + " -> 00 (closed) / 01 (open)", "page": spec.squelchStatus.page});
    }

    choices("Receiver");

    if (spec.toneSquelchStatus)
    {
      define("Receiver", 'property', 'is_tone_squelch_open', {
        "message0": "Is Tone Squelch open?",
        "output": "Boolean",
        "tooltip": "True if the tone squelch (or DTCS, DSQL, CSQL) is open, i.e. a matching signal is received"
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, 0x05})', lua.Order.HIGH];
      }, null, {"civ": "15 05 -> 00 (closed) / 01 (open)", "page": spec.toneSquelchStatus.page});
    }

    /* ------------------------------ TRANSMIT ------------------------------ */

    if (spec.transmit)
    {
      define("Transmit", 'action', 'set_transmit', {
        "message0": "Transmit %1",
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [["on (TX)", "0x01"], ["off (RX)", "0x00"]]}],
        "tooltip": "Switches the transmitter on (like pressing PTT) or back to receive. Make sure your program switches it off again!"
      }, function(block) {
        return 'sendCommand({0x1C, 0x00}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "1C 00 + 00 (RX) / 01 (TX)", "page": spec.transmit.page});
    }

    level(spec.rfPower && Object.assign({"group": "Transmit"}, spec.rfPower), "0x0A", "rf_power", "RF Power", "RF power in % of the maximum");

    if (spec.rfPowerSteps)
    {
      var steps = spec.rfPowerSteps;
      define("Transmit", 'action', 'set_rf_power', {
        "message0": "Set RF Power to %1",
        "args0": [{"type": "field_dropdown", "name": "POWER", "options": steps.options.map(function(o) { return [o[0], String(o[1])]; })}],
        "tooltip": "Sets the RF power: " + optionNames(steps.options)
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x14, 0x0A}, numberToBcd(' + block.getFieldValue('POWER') + ', 2))\n';
      }, null, {"civ": "14 0A + " + steps.options.map(function(o) { return String(o[1]).padStart(4, '0') + " (" + o[0] + ")"; }).join(" / "),
                "page": steps.page});

      define("Transmit", 'property', 'get_rf_power', {
        "message0": "RF Power",
        "output": "String",
        "tooltip": "Reads the RF power setting: " + optionNames(steps.options)
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

    level(spec.micGain && Object.assign({"group": "Transmit"}, spec.micGain), "0x0B", "mic_gain", "Mic Gain", "mic gain");

    if (spec.tone)
    {
      define("Transmit", 'action', 'set_tone_frequency', {
        "message0": "Set Repeater Tone to %1 Hz",
        "args0": [{"type": "input_value", "name": "TONE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the frequency of the repeater tone (CTCSS), e.g. 88.5 Hz"
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x00}, numberToBcd(math.floor(' + value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
      }, function(block) {
        checkRange(block, 'TONE', 67, 254.1, "The repeater tone must be between 67.0 and 254.1 Hz");
      }, {"civ": "1B 00 + 3 bytes BCD in 0.1 Hz", "page": spec.tone.page});
    }

    if (spec.transmit)
    {
      define("Transmit", 'property', 'is_transmitting', {
        "message0": "Is Transmitting?",
        "output": "Boolean",
        "tooltip": "True while the radio transmits"
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
      define(group, 'action', 'set_' + suffix, {
        "message0": "Set " + label + " to %1" + (unit ? " " + unit : ""),
        "args0": [{"type": "input_value", "name": input, "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the " + text + " (" + min + " ~ " + max + (unit ? " " + unit : "") + ")"
      }, function(block) {
        Studio.use(['icomLevel']);
        return 'sendCommand(' + cmd + ', icomLevel(' + value(block, input) + ', ' + min + ', ' + max + '))\n';
      }, function(block) {
        checkRange(block, input, min, max, "The " + text + " must be between " + min + " and " + max + (unit ? " " + unit : ""));
      }, {"civ": "14 " + civBytes(sub) + " + 0000 = " + min + " ~ 0255 = " + max + (unit ? " " + unit : ""), "page": entry.page});

      define(group, 'property', 'get_' + suffix, {
        "message0": label,
        "output": "Number",
        "tooltip": "Reads the " + text + (unit ? " (in " + unit + ")" : " (" + min + " ~ " + max + ")")
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
    scaled(spec.compLevel, "Transmit", "0x0E", "comp_level", "Compressor Level", "LEVEL", 0, 10, "", "level of the speech compressor");

    if (spec.tsql)
    {
      define("Transmit", 'action', 'set_tsql_frequency', {
        "message0": "Set Tone Squelch to %1 Hz",
        "args0": [{"type": "input_value", "name": "TONE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the frequency of the tone squelch (CTCSS), e.g. 88.5 Hz"
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x01}, numberToBcd(math.floor(' + value(block, 'TONE', lua.Order.MULTIPLICATIVE) + ' * 10 + 0.5), 3))\n';
      }, function(block) {
        checkRange(block, 'TONE', 67, 254.1, "The tone squelch frequency must be between 67.0 and 254.1 Hz");
      }, {"civ": "1B 01 + 3 bytes BCD in 0.1 Hz", "page": spec.tsql.page});
    }

    if (spec.dtcs)
    {
      define("Transmit", 'action', 'set_dtcs_code', {
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
        "tooltip": "Sets the DTCS code (e.g. 23 for code 023, digits 0 ~ 7) and its polarity"
      }, function(block) {
        Studio.use(['icomDtcsData']);
        return 'sendCommand({0x1B, 0x02}, icomDtcsData(' + value(block, 'CODE') + ', ' + block.getFieldValue('POLARITY') + '))\n';
      }, function(block) {
        var input = block.getInputTargetBlock('CODE');
        var code = (input && input.type == 'math_number') ? input.getFieldValue('NUM') : null;
        block.setWarningText(code !== null && !/^[0-7]{1,3}$/.test(code) ? "A DTCS code has up to 3 digits from 0 to 7, e.g. 23" : null);
      }, {"civ": "1B 02 + polarity, 0 + first digit, second + third digit", "page": spec.dtcs.page});

      define("Transmit", 'property', 'get_dtcs_code', {
        "message0": "DTCS Code",
        "output": "Number",
        "tooltip": "Reads the DTCS code, e.g. 23 for code 023"
      }, function(block) {
        Studio.use(['icomReadDtcs']);
        return ['icomReadDtcs()', lua.Order.HIGH];
      }, null, {"civ": "1B 02 -> polarity, 0 + first digit, second + third digit", "page": spec.dtcs.page});
    }

    if (spec.csql)
    {
      define("Transmit", 'action', 'set_csql_code', {
        "message0": "Set Digital Code Squelch to %1",
        "args0": [{"type": "input_value", "name": "CODE", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the code of the digital code squelch (CSQL) in DV mode (0 ~ 99)"
      }, function(block) {
        Studio.use(['numberToBcd']);
        return 'sendCommand({0x1B, 0x07}, numberToBcd(' + value(block, 'CODE') + ', 1))\n';
      }, function(block) {
        checkRange(block, 'CODE', 0, 99, "The code must be between 0 and 99");
      }, {"civ": "1B 07 + 00 ~ 99", "page": spec.csql.page});
    }

    /* ------------------------------ METERS ------------------------------ */

    if (spec.sMeter)
    {
      var s = spec.sMeter;
      var units = s.plus60 ? [["S-units", "S"], ["dB over S9", "DB"]] : [["S-units", "S"]];
      define("Meters", 'property', 'get_s_meter', {
        "message0": "S-Meter in %1",
        "args0": [{"type": "field_dropdown", "name": "UNIT", "options": units}],
        "output": "Number",
        "tooltip": s.plus60 ? "Reads the S-meter: in S-units (0 ~ 9), or in dB over S9 (negative below S9, 6 dB per S-unit)"
                            : "Reads the S-meter in S-units (0 ~ 9)"
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

    meter(spec.swr, "0x12", "get_swr_meter_level", "SWR", "", "Reads the SWR while transmitting, e.g. 1.5");
    if (spec.powerOutput)
    {
      var watts = spec.powerOutput.unit == "W";
      meter(spec.powerOutput, "0x11", "get_power_output", "Power Output", watts ? " W" : " %",
            watts ? "Reads the output power while transmitting (in W)" : "Reads the output power meter while transmitting (in % of the maximum)");
    }
    meter(spec.alc, "0x13", "get_alc", "ALC", " %", "Reads the ALC meter while transmitting (in %, 100 = end of the ALC zone)");
    meter(spec.voltage, "0x15", "get_supply_voltage", "Supply Voltage", " V", "Reads the supply voltage of the final amplifier (in V)");
    meter(spec.current, "0x16", "get_supply_current", "Supply Current", " A", "Reads the current drawn by the final amplifier (in A)");

    if (spec.battery)
    {
      define("Meters", 'property', 'is_on_battery', {
        "message0": "Is on Battery?",
        "output": "Boolean",
        "tooltip": "True if the radio is powered by its battery pack, false with an external power supply"
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x1A, 0x0B})', lua.Order.HIGH];
      }, null, {"civ": "1A 0B -> 00 (external power supply) / 01 (battery pack)", "page": spec.battery.page});
    }

    if (spec.overflow)
    {
      define("Meters", 'property', 'is_overflow', {
        "message0": "Is Overflow?",
        "output": "Boolean",
        "tooltip": "True if the OVF indicator is on, i.e. the receiver is overloaded by a strong signal"
      }, function(block) {
        Studio.use(['icomReadOn']);
        return ['icomReadOn({0x15, 0x07})', lua.Order.HIGH];
      }, null, {"civ": "15 07 -> 00 (OVF off) / 01 (OVF on)", "page": spec.overflow.page});
    }

    meter(spec.compMeter, "0x14", "get_comp_meter", "Compression", " dB", "Reads the COMP meter while transmitting with the speech compressor (in dB)");

    /* ------------------------------ CW & VOICE ------------------------------ */

    if (spec.cw)
    {
      define("CW & Voice", 'action', 'send_cw', {
        "message0": "Send CW %1",
        "args0": [{"type": "input_value", "name": "TEXT"}],
        "inputsInline": true,
        "tooltip": "Sends the text (up to 30 characters) as CW. The radio has to be in CW mode with break-in on"
      }, function(block) {
        Studio.use(['icomTextBytes']);
        var text = Blockly.Lua.valueToCode(block, 'TEXT', lua.Order.NONE) || "''";
        return 'sendCommand({0x17}, icomTextBytes(' + text + '))\n';
      }, null, {"civ": "17 + ASCII codes", "page": spec.cw.page});
    }

    if (spec.keyingSpeed)
    {
      define("CW & Voice", 'action', 'set_keying_speed', {
        "message0": "Set CW Speed to %1 WPM",
        "args0": [{"type": "input_value", "name": "WPM", "check": "Number"}],
        "inputsInline": true,
        "tooltip": "Sets the keying speed of the electronic keyer (6 ~ 48 WPM)"
      }, function(block) {
        Studio.use(['icomWpm']);
        return 'sendCommand({0x14, 0x0C}, icomWpm(' + value(block, 'WPM') + '))\n';
      }, function(block) {
        checkRange(block, 'WPM', 6, 48, "The CW speed must be between 6 and 48 WPM");
      }, {"civ": "14 0C + 0000 = 6 WPM ~ 0255 = 48 WPM", "page": spec.keyingSpeed.page});
    }

    if (spec.voiceMemory)
    {
      define("CW & Voice", 'action', 'play_voice_memory', {
        "message0": "Transmit Voice Memory %1",
        "args0": [{
          "type": "field_dropdown",
          "name": "MEMORY",
          "options": [["T1", "0x01"], ["T2", "0x02"], ["T3", "0x03"], ["T4", "0x04"], ["T5", "0x05"],
                      ["T6", "0x06"], ["T7", "0x07"], ["T8", "0x08"], ["stop", "0x00"]]
        }],
        "tooltip": "Transmits a recorded voice memory (e.g. a CQ call), or stops it"
      }, function(block) {
        return 'sendCommand({0x28, 0x00}, {' + block.getFieldValue('MEMORY') + '})\n';
      }, null, {"civ": "28 00 + 01 ~ 08 (T1 ~ T8) / 00 (stop)", "page": spec.voiceMemory.page});
    }

    if (spec.announce)
    {
      define("CW & Voice", 'action', 'announce', {
        "message0": "Announce %1",
        "args0": [{
          "type": "field_dropdown",
          "name": "WHAT",
          "options": [["frequency, S-meter and mode", "0x00"], ["frequency and S-meter", "0x01"], ["mode", "0x02"]]
        }],
        "tooltip": "The radio speaks the selected information with its voice synthesizer"
      }, function(block) {
        return 'sendCommand({0x13, ' + block.getFieldValue('WHAT') + '})\n';
      }, null, {"civ": "13 00 / 01 / 02", "page": spec.announce.page});
    }

    if (spec.keyingSpeed)
    {
      define("CW & Voice", 'property', 'get_keying_speed', {
        "message0": "CW Speed",
        "output": "Number",
        "tooltip": "Reads the keying speed of the electronic keyer (in WPM)"
      }, function(block) {
        Studio.use(['icomReadNumber']);
        return ['math.floor(6 + icomReadNumber({0x14, 0x0C}) * 42 / 255 + 0.5)', lua.Order.HIGH];
      }, null, {"civ": "14 0C -> 0000 = 6 WPM ~ 0255 = 48 WPM", "page": spec.keyingSpeed.page});
    }

    choices("CW & Voice");
    scaled(spec.cwPitch, "CW & Voice", "0x09", "cw_pitch", "CW Pitch", "PITCH", 300, 900, "Hz", "CW pitch", true);
    scaled(spec.breakInDelay, "CW & Voice", "0x0F", "break_in_delay", "Break-In Delay", "DELAY", 2, 13, "dots", "delay of the semi break-in");

    /* ------------------------------ GPS & TIME ------------------------------ */

    if (spec.position)
    {
      define("GPS & Time", 'property', 'get_gps_position', {
        "message0": (spec.position.label || "Position") + " %1",
        "args0": [{
          "type": "field_dropdown",
          "name": "VALUE",
          "options": [["latitude", "lat"], ["longitude", "lon"], ["altitude (m)", "alt"], ["course (°)", "course"], ["speed (km/h)", "speed"]]
        }],
        "output": "Number",
        "tooltip": spec.position.text + ". Latitude and longitude in degrees (north and east positive)"
      }, function(block) {
        Studio.use(['icomGpsValue']);
        return ['icomGpsValue("' + block.getFieldValue('VALUE') + '")', lua.Order.HIGH];
      }, null, {"civ": "23 00", "page": spec.position.page});

      define("GPS & Time", 'property', 'get_gps_time', {
        "message0": "GPS Time (UTC) %1",
        "args0": [{
          "type": "field_dropdown",
          "name": "PART",
          "options": [["as text", "text"], ["unix time", "unix"], ["year", "year"], ["month", "month"], ["day", "day"],
                      ["hour", "hour"], ["minute", "minute"], ["second", "second"]]
        }],
        "output": null,
        "tooltip": "Reads the date and time (UTC) of the GPS. Unix time are the seconds since 1970-01-01"
      }, function(block) {
        Studio.use(['icomGpsTime']);
        return ['icomGpsTime("' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
      }, null, {"civ": "23 00, date and time in UTC", "page": spec.position.page});
    }

    if (spec.clock)
    {
      var clock = spec.clock;
      define("GPS & Time", 'property', 'get_clock', {
        "message0": "Radio Clock %1",
        "args0": [{
          "type": "field_dropdown",
          "name": "PART",
          "options": [["time as text", "time"], ["date as text", "date"], ["year", "year"], ["month", "month"],
                      ["day", "day"], ["hour", "hour"], ["minute", "minute"]]
        }],
        "output": null,
        "tooltip": "Reads the date and time of the clock of the radio (local time)"
      }, function(block) {
        Studio.use(['icomClock']);
        return ['icomClock({0x1A, 0x05, ' + clock.date + '}, {0x1A, 0x05, ' + clock.time + '}, "' + block.getFieldValue('PART') + '")', lua.Order.HIGH];
      }, null, {"civ": "1A 05 " + civBytes(clock.date) + " (date) and 1A 05 " + civBytes(clock.time) + " (time)", "page": clock.page});
    }

    if (spec.position)
    {
      define("GPS & Time", 'helper', 'locator', {
        "message0": "Locator of latitude %1 longitude %2",
        "args0": [
          {"type": "input_value", "name": "LAT", "check": "Number"},
          {"type": "input_value", "name": "LON", "check": "Number"}
        ],
        "inputsInline": true,
        "output": "String",
        "tooltip": "Calculates the Maidenhead locator (6 characters, e.g. JN77rb) of a position"
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
        "message0": "Switch %1 %2",
        "args0": [
          {"type": "field_dropdown", "name": "FUNCTION", "options": functions},
          {"type": "field_dropdown", "name": "STATE", "options": ON_OFF}
        ],
        "tooltip": "Switches a function of the radio on or off"
      }, function(block) {
        return 'sendCommand({0x16, ' + block.getFieldValue('FUNCTION') + '}, {' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "16 xx + 00 (off) / 01 (on)", "page": spec.functions.page});
    }

    level(spec.brightness && Object.assign({"group": "Settings"}, spec.brightness), "0x19", "lcd_brightness", "LCD Brightness", "LCD brightness");

    if (spec.power)
    {
      define("Settings", 'action', 'set_power', {
        "message0": "Switch Radio %1",
        "args0": [{"type": "field_dropdown", "name": "STATE", "options": [["off", "0x00"], ["on", "0x01"]]}],
        "tooltip": "Switches the radio off or on. Switching on only works if the radio is in standby"
      }, function(block) {
        return 'sendCommand({0x18, ' + block.getFieldValue('STATE') + '})\n';
      }, null, {"civ": "18 00 (off) / 18 01 (on)", "page": spec.power.page});
    }

    if (spec.functions)
    {
      define("Settings", 'property', 'is_function_on', {
        "message0": "Is %1 on?",
        "args0": [{"type": "field_dropdown", "name": "FUNCTION", "options": spec.functions.options}],
        "output": "Boolean",
        "tooltip": "True if the function of the radio is switched on"
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
        "message0": "Set %1 to %2 %%",
        "args0": [
          {"type": "field_dropdown", "name": "LEVEL", "options": levels},
          {"type": "input_value", "name": "VALUE", "check": "Number"}
        ],
        "inputsInline": true,
        "tooltip": "Sets a level in %. For a PBT or a notch position 50 % is the center"
      }, function(block) {
        Studio.use(['icomPercent']);
        return 'sendCommand({0x14, ' + block.getFieldValue('LEVEL') + '}, icomPercent(' + value(block, 'VALUE') + '))\n';
      }, function(block) {
        checkRange(block, 'VALUE', 0, 100, "The level must be between 0 and 100%");
      }, {"civ": "14 + " + levels.map(function(o) { return civBytes(o[1]) + " (" + o[0] + ")"; }).join(" / ") + " + 0000 ~ 0255",
          "page": spec.levels.page});

      define("Settings", 'property', 'get_level', {
        "message0": "%1",
        "args0": [{"type": "field_dropdown", "name": "LEVEL", "options": levels}],
        "output": "Number",
        "tooltip": "Reads a level (in %)"
      }, function(block) {
        Studio.use(['icomReadPercent']);
        return ['icomReadPercent({0x14, ' + block.getFieldValue('LEVEL') + '})', lua.Order.HIGH];
      }, null, {"civ": "14 xx -> 0000 ~ 0255", "page": spec.levels.page});
    }

    // Any setting of the menu, by the number of the setting in the CI-V reference guide
    if (spec.menu)
    {
      define("Settings", 'action', 'set_menu', {
        "message0": "Set Menu Setting %1 to %2 %3",
        "args0": [
          {"type": "input_value", "name": "ITEM", "check": "Number"},
          {"type": "input_value", "name": "VALUE", "check": "Number"},
          {"type": "field_dropdown", "name": "BYTES", "options": [["as 00 ~ 99", "1"], ["as 0000 ~ 9999", "2"]]}
        ],
        "inputsInline": true,
        "tooltip": "Changes a setting of the menu (command 1A 05). The number of the setting and the format of its value " +
                   "(00 ~ 99 or 0000 ~ 9999) are in the CI-V reference guide of the radio"
      }, function(block) {
        Studio.use(['icomMenuCmd', 'numberToBcd']);
        return 'sendCommand(icomMenuCmd(' + value(block, 'ITEM') + '), numberToBcd(' + value(block, 'VALUE') + ', ' +
               block.getFieldValue('BYTES') + '))\n';
      }, function(block) {
        checkRange(block, 'ITEM', 1, 9999, "The number of the setting must be between 1 and 9999");
      }, {"civ": "1A 05 + number of the setting (2 bytes BCD) + value (BCD)", "page": spec.menu.page});

      define("Settings", 'property', 'get_menu', {
        "message0": "Menu Setting %1",
        "args0": [{"type": "input_value", "name": "ITEM", "check": "Number"}],
        "inputsInline": true,
        "output": "Number",
        "tooltip": "Reads a setting of the menu (command 1A 05) as number"
      }, function(block) {
        Studio.use(['icomMenuCmd', 'icomReadNumber']);
        return ['icomReadNumber(icomMenuCmd(' + value(block, 'ITEM') + '))', lua.Order.HIGH];
      }, function(block) {
        checkRange(block, 'ITEM', 1, 9999, "The number of the setting must be between 1 and 9999");
      }, {"civ": "1A 05 + number of the setting (2 bytes BCD) -> value (BCD)", "page": spec.menu.page});
    }

    // Register the groups in the toolbox, in the usual order. Within a group: actions, properties, helpers
    GROUPS.forEach(function(name) {
      if (!groups[name])
      {
        return;
      }
      var handle = category.group(name);
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

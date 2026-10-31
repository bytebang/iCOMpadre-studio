// Blocks for the iCOMpadre hardware itself (independent of the connected radio)
// and the common lua functions, which can be used by all other block files.
//
// The generated lua code calls the functions provided by the iCOMpadre firmware:
// sendCommand, readResultOfCommand, wait, millis, configSerial,
// setDigitalOutput, readDigitalInput, setAnalogOutput, readAnalogInput, readTouchInput
//
// Documentation of the blocks: documentation/blocks/base.md

// Register the contribution of this file: one category with a group (and colour) per topic
var base = Studio.category("iCOMpadre");
var program  = base.group("Program", "program");
var radio    = base.group("Radio", "radio");
var pins     = base.group("Pins", "pins");
var serial   = base.group("Serial", "serial");
var helpers  = base.group("Helpers", "helpers");

// Pins of the iCOMpadre connector
var PINS_ALL   = [["PIN A", "PIN_A"], ["PIN B", "PIN_B"], ["PIN C", "PIN_C"], ["PIN D", "PIN_D"],
                  ["PIN E", "PIN_E"], ["PIN F", "PIN_F"], ["PIN G", "PIN_G"], ["PIN H", "PIN_H"]];
var PINS_DAC   = [["PIN A", "PIN_A"], ["PIN B", "PIN_B"]];    // pins with analog output
var PINS_TOUCH = [["PIN C", "PIN_C"], ["PIN D", "PIN_D"], ["PIN E", "PIN_E"],
                  ["PIN F", "PIN_F"], ["PIN G", "PIN_G"], ["PIN H", "PIN_H"]];

/* **************************************************************** */
/*                          LUA FUNCTIONS                           */
/* **************************************************************** */
// Common lua functions -> pull them into the generated code with Studio.use(...)

// Converts a table of bytes into a readable string: {0x01 ,0xa4 }
Studio.luaFunction("pretty", [
  "function pretty(tbl)",
  "  hex = {}",
  "  for i, name in ipairs(tbl) do",
  "    hex[i] = string.format('0x%02x ', name)",
  "  end",
  "  return '{' .. table.concat(hex, ',') .. '}'",
  "end"]);

// Maps a value from one range onto another range (linear)
Studio.luaFunction("map", [
  "function map(x, in_min, in_max, out_min, out_max)",
  "  return out_min + (x - in_min)*(out_max - out_min)/(in_max - in_min)",
  "end"]);

// Converts a frequency as sent by the radio (BCD, least significant byte first) into a number in Hz
Studio.luaFunction("frequencyAsNumber", [
  "function frequencyAsNumber(tbl)",
  "  value = ''",
  "  for i, name in ipairs(tbl) do",
  "    value = string.format('%02x', name) .. value",
  "  end",
  "  return tonumber(value);",
  "end"]);

// Converts a frequency in Hz into BCD bytes (least significant byte first), padded to tblsize bytes.
// Rounds to whole Hz, because e.g. 14.074 * 1e6 is 14073999.999... as floating point number.
Studio.luaFunction("frequencyToBcd", [
  "function frequencyToBcd(freq, tblsize)",
  "  freq = math.floor(freq + 0.5)",
  "  local bcdTable = {}",
  "  while freq > 0 do",
  "    local nibble = freq % 10",
  "    table.insert(bcdTable, 1, nibble)",
  "    freq = math.floor(freq / 10)",
  "  end",
  "  if #bcdTable % 2 == 1 then",
  "    table.insert(bcdTable, 1, 0)",
  "  end",
  "  local finalTable = {}",
  "  for i = 1, #bcdTable, 2 do",
  "    local nibble1 = bcdTable[i+1]",
  "    local nibble2 = bcdTable[i]",
  "    local bcdValue = nibble2 * 16 + nibble1",
  "    table.insert(finalTable, 1, bcdValue)",
  "  end",
  "  if tblsize ~= nil then",
  "    while #finalTable < tblsize do",
  "      table.insert(finalTable, 0x00)",
  "    end",
  "  end",
  "  return finalTable",
  "end"]);

// Converts a number into BCD bytes (most significant byte first), padded to tblsize bytes
Studio.luaFunction("numberToBcd", [
  "function numberToBcd(number, tblsize)",
  "  number = math.floor(number)",
  "  local bcdTable = {}",
  "  while number > 0 do",
  "    local nibble = number % 10",
  "    table.insert(bcdTable, 1, nibble)",
  "    number = math.floor(number / 10)",
  "  end",
  "  if #bcdTable % 2 == 1 then",
  "    table.insert(bcdTable, 1, 0)",
  "  end",
  "  local finalTable = {}",
  "  for i = 1, #bcdTable, 2 do",
  "    local nibble1 = bcdTable[i]",
  "    local nibble2 = bcdTable[i+1]",
  "    local bcdValue = nibble2 + nibble1 * 16",
  "    table.insert(finalTable, bcdValue)",
  "  end",
  "  if(tblsize ~= nil) then",
  "    while #finalTable < tblsize do",
  "      table.insert(finalTable, 1, 0x00)",
  "    end",
  "  end",
  "  return finalTable",
  "end"]);

// Converts BCD bytes (most significant byte first) into a number
Studio.luaFunction("bcdToNumber", [
  "function bcdToNumber(tbl)",
  "  value = ''",
  "  for i, name in ipairs(tbl) do",
  "    value = value .. string.format('%02x', name)",
  "  end",
  "  return tonumber(value);",
  "end"]);

/* **************************************************************** */
/*             PROGRAM: Events, timing and program flow             */
/* **************************************************************** */

// Executed once when the device starts.
// Lua: function onStartup() ... end
Blockly.Blocks['onstartup'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("OnStartup");
    this.appendStatementInput("actions")
        .setCheck(null);
    this.setTooltip("This is executed during the startup of the device");
  }
};

Blockly.Lua['onstartup'] = function(block) {
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function onStartup()\n' + statements_actions + 'end';
};

program.event("onstartup");

//-------------------------------------------------------------------
// Executed as often as possible while a radio is connected.
// Lua: function periodically() ... end
Blockly.Blocks['periodically'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Periodically");
    this.appendStatementInput("actions")
        .setCheck(null);
    this.setTooltip("This is executed periodically if the radio is turned on. Otherwise the function is not called");
  }
};

Blockly.Lua['periodically'] = function(block) {
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function periodically()\n' + statements_actions + 'end';
};

program.event("periodically");

//-------------------------------------------------------------------
// Executes the inner blocks only if the watched value differs from the last call.
// Lua: local actValue = expr
//      if(_G.lastValue ~= actValue ) then _G.lastValue = actValue ... end
Blockly.Blocks['onchangeof'] = {
  init: function() {
    this.appendValueInput("expr")
        .setCheck(null)
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("On change of");
    this.appendStatementInput("statements")
        .setCheck(["Boolean", "Number", "String"]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Executes the block if the watchedValue changes");
  }
};

Blockly.Lua['onchangeof'] = function(block) {
  var value_expr = Blockly.Lua.valueToCode(block, 'expr', Blockly.Lua.ORDER_ATOMIC);
  var statements_statements = Blockly.Lua.statementToCode(block, 'statements');

  // every block gets its own global variable to remember the last value,
  // and a local one for the current value (so it does not collide with variables of the user)
  var lastValue = "_G." + Blockly.Lua.nameDB_.getDistinctName('lastValue', Blockly.Names.NameType.VARIABLE);
  var actValue = Blockly.Lua.nameDB_.getDistinctName('actValue', Blockly.Names.NameType.VARIABLE);

  var code = 'local ' + actValue + ' = ' + value_expr + '\n';
  code = code + 'if(' + lastValue + ' ~= ' + actValue + ' ) then ' + lastValue + ' = ' + actValue + '\n';
  code = code + statements_statements;
  code = code + 'end\n';
  return code;
};

program.action("onchangeof");

//-------------------------------------------------------------------
// Pauses the program for the given time.
// Lua: wait(milliseconds)
Blockly.Blocks['wait'] = {
  init: function() {
    this.jsonInit({
      "type": "wait",
      "message0": "Wait %1 %2 ms",
      "args0": [
        {"type": "input_dummy"},
        {"type": "input_value", "name": "timeout", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Waits for x milliseconds"
    });
  }
};

Blockly.Lua['wait'] = function(block) {
  var value_timeout = Blockly.Lua.valueToCode(block, 'timeout', Blockly.Lua.ORDER_ATOMIC);
  return 'wait(' + value_timeout + ')\n';
};

program.action("wait");

//-------------------------------------------------------------------
// Compiles and runs the given string as lua code.
// Lua: load(chunk)()
Blockly.Blocks['executeluachunk'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("execute Lua Chunk");
    this.appendValueInput("chunk")
        .setCheck("String");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Runs the given Lua Script");
    this.setHelpUrl("https://www.lua.org/manual/5.3/");   // the lua manual is more useful than our docs here
  }
};

Blockly.Lua['executeluachunk'] = function(block) {
  var value_script = Blockly.Lua.valueToCode(block, 'chunk', Blockly.Lua.ORDER_ATOMIC);
  return 'load(' + value_script + ')()\n';
};

program.action("executeluachunk");

//-------------------------------------------------------------------
// Returns the milliseconds since the device has been started.
// Lua: millis()
Blockly.Blocks['millis'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("milliseconds since start");
    this.setOutput(true, "Number");
    this.setTooltip("Returns the milliseconds since the device was started. Rolls over after ~49 days");
  }
};

Blockly.Lua['millis'] = function(block) {
  return ['millis()', Blockly.Lua.ORDER_NONE];
};

program.property("millis");

/* **************************************************************** */
/*           RADIO: Raw CI-V communication with the radio           */
/* **************************************************************** */

// Sends a raw CI-V command (and optional data) to the radio.
// Lua: sendCommand(cmd, data)
Blockly.Blocks['sendcommand'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("send command to radio");
    this.appendValueInput("cmd")
        .setCheck("Array")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("command");
    this.appendValueInput("data")
        .setCheck("Array")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("data");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Sends the given command to the radio");
  }
};

Blockly.Lua['sendcommand'] = function(block) {
  var value_cmd = Blockly.Lua.valueToCode(block, 'cmd', Blockly.Lua.ORDER_ATOMIC);
  var value_data = Blockly.Lua.valueToCode(block, 'data', Blockly.Lua.ORDER_ATOMIC);
  return 'sendCommand(' + value_cmd + ', ' + value_data + ')\n';
};

radio.action("sendcommand");

//-------------------------------------------------------------------
// Sends a raw CI-V command to the radio and returns the bytes of the response.
// Lua: readResultOfCommand(sendCommand(cmd))
Blockly.Blocks['readdata'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Read data from radio");
    this.appendValueInput("commandsequence")
        .setCheck("Array");
    this.setOutput(true, "Array");
    this.setTooltip("Returns the plain resultarray of the given command");
  }
};

Blockly.Lua['readdata'] = function(block) {
  var value_command = Blockly.Lua.valueToCode(block, 'commandsequence', Blockly.Lua.ORDER_ATOMIC);
  var code = 'readResultOfCommand(sendCommand(' + value_command + '))';
  return [code, Blockly.Lua.ORDER_NONE];
};

radio.property("readdata");

//-------------------------------------------------------------------
// Converts a list of BCD bytes into a number.
// Lua: bcdToNumber(list)
Blockly.Blocks['bcdasnumber'] = {
  init: function() {
    this.appendValueInput("inputarray")
        .setCheck("Array")
        .appendField("BCD values as Number");
    this.setOutput(true, "Number");
    this.setTooltip("Converts bcd hex values to the corresponding number");
  }
};

Blockly.Lua['bcdasnumber'] = function(block) {
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', Blockly.Lua.ORDER_ATOMIC);
  Studio.use('bcdToNumber');
  return ['bcdToNumber(' + inarray + ')', Blockly.Lua.ORDER_ATOMIC];
};

radio.helper("bcdasnumber");

//-------------------------------------------------------------------
// Converts a list of bytes into a readable string with hex values.
// Lua: pretty(list)
Blockly.Blocks['prettystring'] = {
  init: function() {
    this.appendValueInput("inputarray")
        .setCheck("Array")
        .appendField("pretty");
    this.setOutput(true, "String");
    this.setTooltip("Converts a list to a string with hex values");
  }
};

Blockly.Lua['prettystring'] = function(block) {
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', Blockly.Lua.ORDER_ATOMIC);
  Studio.use('pretty');
  return ['pretty(' + inarray + ')', Blockly.Lua.ORDER_ATOMIC];
};

radio.helper("prettystring");

/* **************************************************************** */
/*       PINS: Inputs and outputs of the iCOMpadre connector        */
/* **************************************************************** */

// Sets the output voltage of an analog pin (0.0 - 3.3 V).
// Lua: setAnalogOutput(PIN_A, voltage)
Blockly.Blocks['setanalogoutput'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set")
        .appendField(new Blockly.FieldDropdown(PINS_DAC), "pinname");
    this.appendValueInput("newvalue")
        .setCheck("Number")
        .appendField("to Voltage");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Sets the given pin to the selected value");
  }
};

Blockly.Lua['setanalogoutput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var newValue = Blockly.Lua.valueToCode(block, 'newvalue', Blockly.Lua.ORDER_ATOMIC);
  return 'setAnalogOutput(' + desiredPin + ', ' + newValue + ')\n';
};

pins.action("setanalogoutput");

//-------------------------------------------------------------------
// Sets a digital pin to high (true = 3.3 V) or low (false = 0 V).
// Lua: setDigitalOutput(PIN_A, state)
Blockly.Blocks['setdigitaloutput'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set")
        .appendField(new Blockly.FieldDropdown(PINS_ALL), "pinname");
    this.appendValueInput("newvalue")
        .setCheck("Boolean")
        .appendField("to Value");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Sets the digital output to high (true) or low (false)");
  }
};

Blockly.Lua['setdigitaloutput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var newValue = Blockly.Lua.valueToCode(block, 'newvalue', Blockly.Lua.ORDER_ATOMIC);
  return 'setDigitalOutput(' + desiredPin + ', ' + newValue + ')\n';
};

pins.action("setdigitaloutput");

//-------------------------------------------------------------------
// Returns the voltage at the given pin.
// Lua: readAnalogInput(PIN_A)
Blockly.Blocks['readanaloginput'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Voltage of")
        .appendField(new Blockly.FieldDropdown(PINS_ALL), "pinname");
    this.setOutput(true, "Number");
    this.setTooltip("Reads the voltage at the given input in V");
  }
};

Blockly.Lua['readanaloginput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readAnalogInput(' + desiredPin + ')';
  return [code, Blockly.Lua.ORDER_RELATIONAL];
};

pins.property("readanaloginput");

//-------------------------------------------------------------------
// Returns the state of the given pin (true = high, false = low).
// Lua: readDigitalInput(PIN_A)
Blockly.Blocks['readdigitalinput'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("State of")
        .appendField(new Blockly.FieldDropdown(PINS_ALL), "pinname");
    this.setOutput(true, "Boolean");
    this.setTooltip("Read the value of the given input");
  }
};

Blockly.Lua['readdigitalinput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readDigitalInput(' + desiredPin + ')';
  return [code, Blockly.Lua.ORDER_RELATIONAL];
};

pins.property("readdigitalinput");

//-------------------------------------------------------------------
// Returns the raw value of the capacitive touch sensor of a pin (lower = touched).
// Lua: readTouchInput(PIN_C)
Blockly.Blocks['touchvalue'] = {
  init: function() {
    this.jsonInit({
      "message0": "Touch value of %1",
      "args0": [
        {"type": "field_dropdown", "name": "pinname", "options": PINS_TOUCH}
      ],
      "output": "Number",
      "tooltip": "Reads the touch value of a pin"
    });
  }
};

Blockly.Lua['touchvalue'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readTouchInput(' + desiredPin + ')';
  return [code, Blockly.Lua.ORDER_RELATIONAL];
};

pins.property("touchvalue");

//-------------------------------------------------------------------
// Returns true if a pin is touched (or released). The threshold is 30.
// Lua: (readTouchInput(PIN_C) < 30)
Blockly.Blocks['isTouched'] = {
  init: function() {
    this.jsonInit({
      "message0": "Is %1 %2 ?",
      "args0": [
        {"type": "field_dropdown", "name": "pinname", "options": PINS_TOUCH},
        {"type": "field_dropdown", "name": "threshold", "options": [["touched", "< 30"], ["released", ">= 30"]]}
      ],
      "output": "Boolean",
      "tooltip": "Returns true if a pin has been touched"
    });
  }
};

Blockly.Lua['isTouched'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var threshold = block.getFieldValue('threshold');
  var code = '(readTouchInput(' + desiredPin + ') ' + threshold + ')';
  return [code, Blockly.Lua.ORDER_RELATIONAL];
};

pins.property("isTouched");

//-------------------------------------------------------------------
// A voltage with unit. Converts it to its base unit V.
// Lua: 3.3 for a plain number (calculated when the code is generated), otherwise expr * 0.001
Blockly.Blocks['voltagevalue'] = {
  init: function() {
    this.jsonInit({
      "message0": "%1 %2",
      "args0": [
        {"type": "input_value", "name": "voltage", "check": "Number"},
        {"type": "field_dropdown", "name": "vunit", "options": [["V", "1"], ["mV", "0.001"]]}
      ],
      "output": "Number",
      "tooltip": "Voltage representation"
    });
  }
};

Blockly.Lua['voltagevalue'] = function(block) {
  var voltageValue = Blockly.Lua.valueToCode(block, 'voltage', Blockly.Lua.ORDER_MULTIPLICATIVE) || '0';
  var dropdown_unit = block.getFieldValue('vunit');

  // a plain number can be converted right away
  if (/^-?\d+(\.\d+)?$/.test(voltageValue))
  {
    return [String(parseFloat(voltageValue) * parseFloat(dropdown_unit)), Blockly.Lua.ORDER_ATOMIC];
  }

  // everything else (variables, calculations, ...) has to be converted at runtime
  if (dropdown_unit == "1")
  {
    return [voltageValue, Blockly.Lua.ORDER_MULTIPLICATIVE];
  }
  return [voltageValue + ' * ' + dropdown_unit, Blockly.Lua.ORDER_MULTIPLICATIVE];
};

pins.helper("voltagevalue");

/* **************************************************************** */
/*                   SERIAL: The serial interface                   */
/* **************************************************************** */

// Executed when a complete line has been received on the serial interface.
// Lua: function onSerialLine(line) ... end
Blockly.Blocks['onserialline'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(new Blockly.FieldVariable("line"), "Line");
    this.appendStatementInput("actions")
        .setCheck(null)
        .appendField("OnSerialLine");
    this.setTooltip("This is triggered when a user enters a command on the serial interface. The content of the line is in the variable line");
  }
};

Blockly.Lua['onserialline'] = function(block) {
  var variable_line = Blockly.Lua.nameDB_.getName(block.getFieldValue('Line'), Blockly.Names.NameType.VARIABLE);
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function onSerialLine(' + variable_line + ')\n' + statements_actions + 'end';
};

serial.event("onserialline");

//-------------------------------------------------------------------
// Executed for every byte received on the serial interface.
// Lua: function onSerialByte(byte) ... end
Blockly.Blocks['onserialbyte'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(new Blockly.FieldVariable("byte"), "Byte");
    this.appendStatementInput("actions")
        .setCheck(null)
        .appendField("OnSerialByte");
    this.setTooltip("This is triggered each time a byte arrives on the serial interface. The value of the byte is in the variable byte as number");
  }
};

Blockly.Lua['onserialbyte'] = function(block) {
  var variable_data = Blockly.Lua.nameDB_.getName(block.getFieldValue('Byte'), Blockly.Names.NameType.VARIABLE);
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function onSerialByte(' + variable_data + ')\n' + statements_actions + 'end';
};

serial.event("onserialbyte");

//-------------------------------------------------------------------
// The standard blockly print block. Prints to the serial interface.
serial.action("text_print");

//-------------------------------------------------------------------
// Sets the baudrate of the serial interface (always 8 data bits, no parity, 1 stop bit).
// Lua: configSerial(baudrate)
Blockly.Blocks['configserial'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set serial speed to  %1,8,N,1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "speed",
          "options": [["110", "110"], ["300", "300"], ["600", "600"], ["1200", "1200"],
                      ["2400", "2400"], ["4800", "4800"], ["9600", "9600"],
                      ["14400", "14400"], ["19200", "19200"], ["38400", "38400"],
                      ["57600", "57600"], ["115200", "115200"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Sets the speed of the serial port"
    });
  }
};

Blockly.Lua['configserial'] = function(block) {
  var value_speed = block.getFieldValue('speed');
  return 'configSerial(' + value_speed + ')\n';
};

serial.action("configserial");

/* **************************************************************** */
/*             HELPERS: Conversions and other utilities             */
/* **************************************************************** */

// A comment in the program. Does nothing.
// Lua: -- text
Blockly.Blocks['comment'] = {
  init: function() {
    this.jsonInit({
      "type": "comment",
      "message0": "Comment: %1",
      "args0": [
        {"type": "field_input", "name": "theContent", "check": "String"}
      ],
      "inputsInline": false,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Does nothing, is just for commenting"
    });
  }
};

Blockly.Lua['comment'] = function(block) {
  var theComment = block.getFieldValue('theContent');
  return "-- " + theComment + "\n";
};

helpers.helper("comment");

//-------------------------------------------------------------------
// Maps a number from one range onto another.
// Lua: map(value, in_min, in_max, out_min, out_max)
Blockly.Blocks['mapnumber'] = {
  init: function() {
    this.appendValueInput("val").setCheck("Number").appendField("map");
    this.appendValueInput("in_min").setCheck("Number").appendField("from range of");
    this.appendValueInput("in_max").setCheck("Number").appendField("-");
    this.appendValueInput("out_min").setCheck("Number").appendField("to range from");
    this.appendValueInput("out_max").setCheck("Number").appendField("-");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setTooltip("Maps a number from one range into another (by linear intra/extrapolation).");
  }
};

Blockly.Lua['mapnumber'] = function(block) {
  var value_val = Blockly.Lua.valueToCode(block, 'val', Blockly.Lua.ORDER_ATOMIC);
  var value_in_min = Blockly.Lua.valueToCode(block, 'in_min', Blockly.Lua.ORDER_ATOMIC);
  var value_in_max = Blockly.Lua.valueToCode(block, 'in_max', Blockly.Lua.ORDER_ATOMIC);
  var value_out_min = Blockly.Lua.valueToCode(block, 'out_min', Blockly.Lua.ORDER_ATOMIC);
  var value_out_max = Blockly.Lua.valueToCode(block, 'out_max', Blockly.Lua.ORDER_ATOMIC);
  Studio.use('map');
  var code = 'map(' + value_val + ', ' + value_in_min + ', ' + value_in_max + ', ' + value_out_min + ', ' + value_out_max + ')';
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

helpers.helper("mapnumber");

//-------------------------------------------------------------------
// Converts a byte value into the corresponding character.
// Lua: string.char(byte)
Blockly.Blocks['asChar'] = {
  init: function() {
    this.appendValueInput("inByte")
        .setCheck("Number")
        .appendField("char of");
    this.setOutput(true, "String");
    this.setTooltip("Converts the number to a character");
  }
};

Blockly.Lua['asChar'] = function(block) {
  var inbyte = Blockly.Lua.valueToCode(block, 'inByte', Blockly.Lua.ORDER_ATOMIC);
  return ['string.char(' + inbyte + ')', Blockly.Lua.ORDER_ATOMIC];
};

helpers.helper("asChar");

//-------------------------------------------------------------------
// Converts the first character of a text into its byte value.
// Lua: string.byte("c")
Blockly.Blocks['asByte'] = {
  init: function() {
    this.jsonInit({
      "type": "asByte",
      "message0": "byte of character %1",
      "args0": [
        {"type": "field_input", "name": "inChar", "check": "String"}
      ],
      "output": "Number",
      "inputsInline": false,
      "tooltip": "Converts the first character of the given string to a numeric byte value"
    });
  }
};

Blockly.Lua['asByte'] = function(block) {
  var inchar = block.getFieldValue('inChar');
  return ['string.byte("' + inchar + '")', Blockly.Lua.ORDER_ATOMIC];
};

helpers.helper("asByte");

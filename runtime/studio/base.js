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
var storage  = base.group("Storage", "storage");
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

Blockly.Lua.forBlock['onstartup'] = function(block) {
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

Blockly.Lua.forBlock['periodically'] = function(block) {
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function periodically()\n' + statements_actions + 'end';
};

program.event("periodically");

//-------------------------------------------------------------------
// Executed when the radio starts to answer (after the start of iCOMpadre or when it is switched on).
// Lua: function onRadioConnected() ... end
Blockly.Blocks['onradioconnected'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("OnRadioConnected");
    this.appendStatementInput("actions")
        .setCheck(null);
    this.setTooltip("This is executed when the radio starts to answer: after the start of iCOMpadre or when the radio is switched on");
  }
};

Blockly.Lua.forBlock['onradioconnected'] = function(block) {
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function onRadioConnected()\n' + statements_actions + 'end';
};

program.event("onradioconnected");

//-------------------------------------------------------------------
// Executed when the radio stops to answer (e.g. when it is switched off).
// Lua: function onRadioDisconnected() ... end
Blockly.Blocks['onradiodisconnected'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("OnRadioDisconnected");
    this.appendStatementInput("actions")
        .setCheck(null);
    this.setTooltip("This is executed when the radio stops to answer, e.g. when it is switched off");
  }
};

Blockly.Lua.forBlock['onradiodisconnected'] = function(block) {
  var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
  return 'function onRadioDisconnected()\n' + statements_actions + 'end';
};

program.event("onradiodisconnected");

//-------------------------------------------------------------------
// Executes the inner blocks only if the watched value differs from the last call.
// Lua: local actValue = expr
//      if(_G.lastValue ~= actValue ) then _G.lastValue = actValue ... end
Blockly.Blocks['onchangeof'] = {
  init: function() {
    this.appendValueInput("expr")
        .setCheck(null)
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField("On change of");
    this.appendStatementInput("statements")
        .setCheck(["Boolean", "Number", "String"]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Executes the block if the watchedValue changes");
  }
};

Blockly.Lua.forBlock['onchangeof'] = function(block) {
  var value_expr = Blockly.Lua.valueToCode(block, 'expr', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['wait'] = function(block) {
  var value_timeout = Blockly.Lua.valueToCode(block, 'timeout', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['executeluachunk'] = function(block) {
  var value_script = Blockly.Lua.valueToCode(block, 'chunk', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['millis'] = function(block) {
  return ['millis()', lua.Order.NONE];
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
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField("command");
    this.appendValueInput("data")
        .setCheck("Array")
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField("data");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Sends the given command to the radio");
  }
};

Blockly.Lua.forBlock['sendcommand'] = function(block) {
  var value_cmd = Blockly.Lua.valueToCode(block, 'cmd', lua.Order.ATOMIC);
  var value_data = Blockly.Lua.valueToCode(block, 'data', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['readdata'] = function(block) {
  var value_command = Blockly.Lua.valueToCode(block, 'commandsequence', lua.Order.ATOMIC);
  var code = 'readResultOfCommand(sendCommand(' + value_command + '))';
  return [code, lua.Order.NONE];
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

Blockly.Lua.forBlock['bcdasnumber'] = function(block) {
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', lua.Order.ATOMIC);
  Studio.use('bcdToNumber');
  return ['bcdToNumber(' + inarray + ')', lua.Order.ATOMIC];
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

Blockly.Lua.forBlock['prettystring'] = function(block) {
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', lua.Order.ATOMIC);
  Studio.use('pretty');
  return ['pretty(' + inarray + ')', lua.Order.ATOMIC];
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

Blockly.Lua.forBlock['setanalogoutput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var newValue = Blockly.Lua.valueToCode(block, 'newvalue', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['setdigitaloutput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var newValue = Blockly.Lua.valueToCode(block, 'newvalue', lua.Order.ATOMIC);
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

Blockly.Lua.forBlock['readanaloginput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readAnalogInput(' + desiredPin + ')';
  return [code, lua.Order.RELATIONAL];
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

Blockly.Lua.forBlock['readdigitalinput'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readDigitalInput(' + desiredPin + ')';
  return [code, lua.Order.RELATIONAL];
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

Blockly.Lua.forBlock['touchvalue'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var code = 'readTouchInput(' + desiredPin + ')';
  return [code, lua.Order.RELATIONAL];
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

Blockly.Lua.forBlock['isTouched'] = function(block) {
  var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
  var threshold = block.getFieldValue('threshold');
  var code = '(readTouchInput(' + desiredPin + ') ' + threshold + ')';
  return [code, lua.Order.RELATIONAL];
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

Blockly.Lua.forBlock['voltagevalue'] = function(block) {
  var voltageValue = Blockly.Lua.valueToCode(block, 'voltage', lua.Order.MULTIPLICATIVE) || '0';
  var dropdown_unit = block.getFieldValue('vunit');

  // a plain number can be converted right away
  if (/^-?\d+(\.\d+)?$/.test(voltageValue))
  {
    return [String(parseFloat(voltageValue) * parseFloat(dropdown_unit)), lua.Order.ATOMIC];
  }

  // everything else (variables, calculations, ...) has to be converted at runtime
  if (dropdown_unit == "1")
  {
    return [voltageValue, lua.Order.MULTIPLICATIVE];
  }
  return [voltageValue + ' * ' + dropdown_unit, lua.Order.MULTIPLICATIVE];
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
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new Blockly.FieldVariable("line"), "Line");
    this.appendStatementInput("actions")
        .setCheck(null)
        .appendField("OnSerialLine");
    this.setTooltip("This is triggered when a user enters a command on the serial interface. The content of the line is in the variable line");
  }
};

Blockly.Lua.forBlock['onserialline'] = function(block) {
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
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new Blockly.FieldVariable("byte"), "Byte");
    this.appendStatementInput("actions")
        .setCheck(null)
        .appendField("OnSerialByte");
    this.setTooltip("This is triggered each time a byte arrives on the serial interface. The value of the byte is in the variable byte as number");
  }
};

Blockly.Lua.forBlock['onserialbyte'] = function(block) {
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

Blockly.Lua.forBlock['configserial'] = function(block) {
  var value_speed = block.getFieldValue('speed');
  return 'configSerial(' + value_speed + ')\n';
};

serial.action("configserial");

/* **************************************************************** */
/*         STORAGE: Files and remembered values on the SD card      */
/* **************************************************************** */
// The firmware provides the standard lua libraries io and os (only os.remove, os.rename, os.clock).
// They only work in the directory /data of the SD card and accept plain file names
// (letters, digits, _ - . and up to 32 characters). On errors they return nil and a message.

// Default values of the inputs in the toolbox
function storageDefault(inputs)
{
  var entry = {"inputs": {}};
  Object.keys(inputs).forEach(function(name) {
    var value = inputs[name];
    entry.inputs[name] = {"shadow": typeof value == "number" ? {"type": "math_number", "fields": {"NUM": value}}
                                                             : {"type": "text", "fields": {"TEXT": value}}};
  });
  return entry;
}

// Prints the error of a file function on the serial interface, returns true if it worked
Studio.luaFunction("storageCheck", [
  "function storageCheck(ok, err)",
  "  if not ok then print('Storage: ' .. tostring(err)) end",
  "  return ok == true",
  "end"]);

// Converts a value into lua source code (numbers, texts, true/false and lists)
Studio.luaFunction("storageLiteral", [
  "function storageLiteral(v)",
  "  local t = type(v)",
  "  if t == 'string' then return string.format('%q', v) end",
  "  if t == 'number' or t == 'boolean' then return tostring(v) end",
  "  if t == 'table' then",
  "    local parts = {}",
  "    for k, x in pairs(v) do parts[#parts + 1] = '[' .. storageLiteral(k) .. '] = ' .. storageLiteral(x) end",
  "    return '{' .. table.concat(parts, ', ') .. '}'",
  "  end",
  "  return 'nil'",
  "end"]);

// Returns the content of a file, or nil and an error message
Studio.luaFunction("storageRead", [
  "function storageRead(name)",
  "  local file, err = io.open(name, 'r')",
  "  if not file then return nil, err end",
  "  local text = file:read('a')",
  "  file:close()",
  "  return text",
  "end"]);

// Writes (mode 'w') or appends (mode 'a') a text to a file, returns true or nil and an error message
Studio.luaFunction("storageWrite", [
  "function storageWrite(name, text, mode)",
  "  local file, err = io.open(name, mode or 'w')",
  "  if not file then return nil, err end",
  "  local ok, werr = file:write(tostring(text))",
  "  file:close()",
  "  if not ok then return nil, werr end",
  "  return true",
  "end"]);

// True if the file exists
Studio.luaFunction("storageExists", [
  "function storageExists(name)",
  "  local file = io.open(name, 'r')",
  "  if file then file:close() end",
  "  return file ~= nil",
  "end"]);

// The remembered values, loaded once from /data/memory.lua
Studio.luaFunction("kvLoad", [
  "function kvLoad()",
  "  if _kvStore == nil then",
  "    _kvStore = {}",
  "    local text = storageRead('memory.lua')",
  "    local chunk = text and load(text)",
  "    if chunk then",
  "      local ok, store = pcall(chunk)",
  "      if ok and type(store) == 'table' then _kvStore = store end",
  "    end",
  "  end",
  "  return _kvStore",
  "end"], ["storageRead"]);

// Writes all remembered values to /data/memory.lua
Studio.luaFunction("kvSave", [
  "function kvSave()",
  "  local keys = {}",
  "  for k in pairs(_kvStore) do keys[#keys + 1] = k end",
  "  table.sort(keys)",
  "  local lines = {'return {'}",
  "  for _, k in ipairs(keys) do",
  "    lines[#lines + 1] = '  [' .. storageLiteral(k) .. '] = ' .. storageLiteral(_kvStore[k]) .. ','",
  "  end",
  "  lines[#lines + 1] = '}'",
  "  return storageCheck(storageWrite('memory.lua', table.concat(lines, '\\n') .. '\\n'))",
  "end"], ["storageCheck", "storageLiteral", "storageWrite"]);

// Remembers a value under a name. The SD card is only written if the value has changed.
Studio.luaFunction("kvSet", [
  "function kvSet(key, value)",
  "  local store = kvLoad()",
  "  key = tostring(key)",
  "  if store[key] == value then return end",
  "  store[key] = value",
  "  kvSave()",
  "end"], ["kvLoad", "kvSave"]);

// Returns the value remembered under a name, or the default if there is none
Studio.luaFunction("kvGet", [
  "function kvGet(key, default)",
  "  local value = kvLoad()[tostring(key)]",
  "  if value == nil then return default end",
  "  return value",
  "end"], ["kvLoad"]);

// Appends a line to a file
Studio.luaFunction("storageAppendLine", [
  "function storageAppendLine(name, text)",
  "  return storageCheck(storageWrite(name, tostring(text) .. '\\n', 'a'))",
  "end"], ["storageCheck", "storageWrite"]);

// Converts a list into a CSV line (values with comma or quotes are quoted)
Studio.luaFunction("storageCsvLine", [
  "function storageCsvLine(list)",
  "  local fields = {}",
  "  for i, v in ipairs(list) do",
  "    local s = tostring(v)",
  "    if string.find(s, '[,\"\\n]') then s = '\"' .. string.gsub(s, '\"', '\"\"') .. '\"' end",
  "    fields[i] = s",
  "  end",
  "  return table.concat(fields, ',')",
  "end"]);

// Returns the lines of a file as list (empty if the file does not exist).
// Reads line by line, so also big files work.
Studio.luaFunction("storageLines", [
  "function storageLines(name)",
  "  local lines = {}",
  "  local file = io.open(name, 'r')",
  "  if not file then return lines end",
  "  for line in file:lines() do",
  "    line = string.gsub(line, '\\r$', '')",
  "    if line ~= '' then lines[#lines + 1] = line end",
  "  end",
  "  file:close()",
  "  return lines",
  "end"]);

// Remembers a value under a name. It is kept on the SD card, also when iCOMpadre is switched off.
// Lua: kvSet("counter", 42)
Blockly.Blocks['storage_remember'] = {
  init: function() {
    this.jsonInit({
      "message0": "Remember %1 as %2",
      "args0": [
        {"type": "input_value", "name": "VALUE"},
        {"type": "input_value", "name": "KEY", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Remembers a value (number, text, true/false or list) under a name. It is kept on the SD card, also when iCOMpadre is switched off"
    });
  }
};

Blockly.Lua.forBlock['storage_remember'] = function(block) {
  Studio.use('kvSet');
  var value = Blockly.Lua.valueToCode(block, 'VALUE', lua.Order.NONE) || 'nil';
  var key = Blockly.Lua.valueToCode(block, 'KEY', lua.Order.NONE) || "''";
  return 'kvSet(' + key + ', ' + value + ')\n';
};

storage.action("storage_remember", storageDefault({"VALUE": 0, "KEY": "counter"}));

//-------------------------------------------------------------------
// Forgets a remembered value.
// Lua: kvSet("counter", nil)
Blockly.Blocks['storage_forget'] = {
  init: function() {
    this.jsonInit({
      "message0": "Forget %1",
      "args0": [
        {"type": "input_value", "name": "KEY", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Forgets the value remembered under the name"
    });
  }
};

Blockly.Lua.forBlock['storage_forget'] = function(block) {
  Studio.use('kvSet');
  var key = Blockly.Lua.valueToCode(block, 'KEY', lua.Order.NONE) || "''";
  return 'kvSet(' + key + ', nil)\n';
};

storage.action("storage_forget", storageDefault({"KEY": "counter"}));

//-------------------------------------------------------------------
// Appends a line of text to a file, e.g. for a log.
// Lua: storageAppendLine("log.txt", text)
Blockly.Blocks['storage_append_line'] = {
  init: function() {
    this.jsonInit({
      "message0": "Append line %1 to file %2",
      "args0": [
        {"type": "input_value", "name": "TEXT"},
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Appends the text as a new line to the end of the file. The file is created if it does not exist"
    });
  }
};

Blockly.Lua.forBlock['storage_append_line'] = function(block) {
  Studio.use('storageAppendLine');
  var text = Blockly.Lua.valueToCode(block, 'TEXT', lua.Order.NONE) || "''";
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return 'storageAppendLine(' + file + ', ' + text + ')\n';
};

storage.action("storage_append_line", storageDefault({"TEXT": "Hello", "FILE": "log.txt"}));

//-------------------------------------------------------------------
// Appends a list of values as CSV line, e.g. for a log that can be opened in a spreadsheet.
// Lua: storageAppendLine("log.csv", storageCsvLine(list))
Blockly.Blocks['storage_append_csv'] = {
  init: function() {
    this.jsonInit({
      "message0": "Append values %1 to CSV file %2",
      "args0": [
        {"type": "input_value", "name": "LIST", "check": "Array"},
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Appends the values of the list as a new line to a CSV file, which can be opened in a spreadsheet"
    });
  }
};

Blockly.Lua.forBlock['storage_append_csv'] = function(block) {
  Studio.use(['storageAppendLine', 'storageCsvLine']);
  var list = Blockly.Lua.valueToCode(block, 'LIST', lua.Order.NONE) || '{}';
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return 'storageAppendLine(' + file + ', storageCsvLine(' + list + '))\n';
};

storage.action("storage_append_csv", storageDefault({"FILE": "log.csv"}));

//-------------------------------------------------------------------
// Replaces the content of a file with a text.
// Lua: storageWrite("notes.txt", text, "w")
Blockly.Blocks['storage_write_file'] = {
  init: function() {
    this.jsonInit({
      "message0": "Write text %1 to file %2",
      "args0": [
        {"type": "input_value", "name": "TEXT"},
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Writes the text to the file. The old content of the file is replaced"
    });
  }
};

Blockly.Lua.forBlock['storage_write_file'] = function(block) {
  Studio.use(['storageCheck', 'storageWrite']);
  var text = Blockly.Lua.valueToCode(block, 'TEXT', lua.Order.NONE) || "''";
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return 'storageCheck(storageWrite(' + file + ', ' + text + ', "w"))\n';
};

storage.action("storage_write_file", storageDefault({"TEXT": "Hello", "FILE": "notes.txt"}));

//-------------------------------------------------------------------
// Deletes a file.
// Lua: os.remove("log.csv")
Blockly.Blocks['storage_delete_file'] = {
  init: function() {
    this.jsonInit({
      "message0": "Delete file %1",
      "args0": [
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Deletes the file"
    });
  }
};

Blockly.Lua.forBlock['storage_delete_file'] = function(block) {
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return 'os.remove(' + file + ')\n';
};

storage.action("storage_delete_file", storageDefault({"FILE": "log.csv"}));

//-------------------------------------------------------------------
// Returns a remembered value, or the default if nothing has been remembered under the name.
// Lua: kvGet("counter", 0)
Blockly.Blocks['storage_recall'] = {
  init: function() {
    this.jsonInit({
      "message0": "Recall %1 or else %2",
      "args0": [
        {"type": "input_value", "name": "KEY", "check": "String"},
        {"type": "input_value", "name": "DEFAULT"}
      ],
      "inputsInline": true,
      "output": null,
      "tooltip": "Returns the value remembered under the name. If nothing has been remembered yet, the value after 'or else' is returned"
    });
  }
};

Blockly.Lua.forBlock['storage_recall'] = function(block) {
  Studio.use('kvGet');
  var key = Blockly.Lua.valueToCode(block, 'KEY', lua.Order.NONE) || "''";
  var fallback = Blockly.Lua.valueToCode(block, 'DEFAULT', lua.Order.NONE) || 'nil';
  return ['kvGet(' + key + ', ' + fallback + ')', lua.Order.HIGH];
};

storage.property("storage_recall", storageDefault({"KEY": "counter", "DEFAULT": 0}));

//-------------------------------------------------------------------
// Returns the lines of a file as list.
// Lua: storageLines("log.txt")
Blockly.Blocks['storage_file_lines'] = {
  init: function() {
    this.jsonInit({
      "message0": "Lines of file %1",
      "args0": [
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "output": "Array",
      "tooltip": "Returns the lines of the file as a list. The list is empty if the file does not exist"
    });
  }
};

Blockly.Lua.forBlock['storage_file_lines'] = function(block) {
  Studio.use('storageLines');
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return ['storageLines(' + file + ')', lua.Order.HIGH];
};

storage.property("storage_file_lines", storageDefault({"FILE": "log.txt"}));

//-------------------------------------------------------------------
// Returns the content of a file as text.
// Lua: (storageRead("notes.txt") or "")
Blockly.Blocks['storage_read_file'] = {
  init: function() {
    this.jsonInit({
      "message0": "Text of file %1",
      "args0": [
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "output": "String",
      "tooltip": "Returns the content of the file as text. The text is empty if the file does not exist"
    });
  }
};

Blockly.Lua.forBlock['storage_read_file'] = function(block) {
  Studio.use('storageRead');
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return ['(storageRead(' + file + ') or "")', lua.Order.HIGH];
};

storage.property("storage_read_file", storageDefault({"FILE": "notes.txt"}));

//-------------------------------------------------------------------
// Lua: storageExists("log.csv")
Blockly.Blocks['storage_file_exists'] = {
  init: function() {
    this.jsonInit({
      "message0": "File %1 exists?",
      "args0": [
        {"type": "input_value", "name": "FILE", "check": "String"}
      ],
      "inputsInline": true,
      "output": "Boolean",
      "tooltip": "True if the file exists"
    });
  }
};

Blockly.Lua.forBlock['storage_file_exists'] = function(block) {
  Studio.use('storageExists');
  var file = Blockly.Lua.valueToCode(block, 'FILE', lua.Order.NONE) || "''";
  return ['storageExists(' + file + ')', lua.Order.HIGH];
};

storage.property("storage_file_exists", storageDefault({"FILE": "log.csv"}));

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

Blockly.Lua.forBlock['comment'] = function(block) {
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

Blockly.Lua.forBlock['mapnumber'] = function(block) {
  var value_val = Blockly.Lua.valueToCode(block, 'val', lua.Order.ATOMIC);
  var value_in_min = Blockly.Lua.valueToCode(block, 'in_min', lua.Order.ATOMIC);
  var value_in_max = Blockly.Lua.valueToCode(block, 'in_max', lua.Order.ATOMIC);
  var value_out_min = Blockly.Lua.valueToCode(block, 'out_min', lua.Order.ATOMIC);
  var value_out_max = Blockly.Lua.valueToCode(block, 'out_max', lua.Order.ATOMIC);
  Studio.use('map');
  var code = 'map(' + value_val + ', ' + value_in_min + ', ' + value_in_max + ', ' + value_out_min + ', ' + value_out_max + ')';
  return [code, lua.Order.ATOMIC];
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

Blockly.Lua.forBlock['asChar'] = function(block) {
  var inbyte = Blockly.Lua.valueToCode(block, 'inByte', lua.Order.ATOMIC);
  return ['string.char(' + inbyte + ')', lua.Order.ATOMIC];
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

Blockly.Lua.forBlock['asByte'] = function(block) {
  var inchar = block.getFieldValue('inChar');
  return ['string.byte("' + inchar + '")', lua.Order.ATOMIC];
};

helpers.helper("asByte");

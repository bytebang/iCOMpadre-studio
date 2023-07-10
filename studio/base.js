// Describe the contribution
contribution = {
    "kind": "category",  "name": "iCOMpadre",
    "contents": []
};

// Insert menu contributions in these arrays
// they will be added to the menu at the end 
events = [];
actions = [];
properties = [];
helpers = [];

/* **************************************************************** */
/*                          EVENTS                                  */
/* **************************************************************** */
Blockly.Blocks['onstartup'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("OnStartup");
        this.appendStatementInput("actions")
            .setCheck(null);
        this.setColour(230);
        this.setTooltip("This is executed during the startup of the device");
        this.setHelpUrl("");
    }
};

Blockly.Lua['onstartup'] = function(block) {
    var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
    var code = 'function onStartUp()\n';
    code = code + statements_actions;
    code = code + 'end';
    return code;
}; 

events.push({"kind": "block",  "type": "onstartup"})

//-------------------------------------------------------------------
Blockly.Blocks['periodically'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Periodically");
        this.appendStatementInput("actions")
            .setCheck(null);
        this.setColour(230);
    this.setTooltip("This is executed periodically if the radio is turned on. Otherwise the function is not called");
    this.setHelpUrl("");
    }
};

Blockly.Lua['periodically'] = function(block) {
    var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
    var code = 'function periodically()\n';
    code = code + statements_actions;
    code = code + 'end';
    return code;
}; 

events.push({"kind": "block",  "type": "periodically"})

//-------------------------------------------------------------------
Blockly.Blocks['onserialline'] = {
    init: function() {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(new Blockly.FieldVariable("line"), "Line");
        this.appendStatementInput("actions")
            .setCheck(null)
            .appendField("OnSerialLine");
        this.setColour(0);
    this.setTooltip("This is triggered when a user enters a command on the serial interface. The content of the line is in the variable line");
    this.setHelpUrl("");
    }
};

Blockly.Lua['onserialline'] = function(block) {
    var variable_line = Blockly.Lua.nameDB_.getName(block.getFieldValue('Line'), Blockly.Names.NameType.VARIABLE);
    var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
    var code = 'function onSerialLine(' + variable_line + ')\n';
    code = code + statements_actions;
    code = code + 'end';
    return code;
};
events.push({"kind": "block",  "type": "onserialline"})

//-------------------------------------------------------------------
Blockly.Blocks['onserialbyte'] = {
    init: function() {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(new Blockly.FieldVariable("byte"), "Byte");
        this.appendStatementInput("actions")
            .setCheck(null)
            .appendField("OnSerialByte");
        this.setColour(0);
    this.setTooltip("This is triggered each time a byte arrives on the serial interface. The content of the line is in the variable char as number value");
    this.setHelpUrl("");
    }
};

Blockly.Lua['onserialbyte'] = function(block) {
    var variable_data = Blockly.Lua.nameDB_.getName(block.getFieldValue('Byte'), Blockly.Names.NameType.VARIABLE);
    var statements_actions = Blockly.Lua.statementToCode(block, 'actions');
    var code = 'function onSerialByte(' + variable_data + ')\n';
    code = code + statements_actions;
    code = code + 'end';
    return code;
};
events.push({"kind": "block",  "type": "onserialbyte"})

//-------------------------------------------------------------------
// events.push({"kind": "block",  "type": "onserialline"})

/* **************************************************************** */
/*                          ACTIONS                                 */
/* **************************************************************** */
Blockly.Blocks['onchangeof'] = {
  init: function() {
    //this.appendDummyInput().appendField("On change of");
    this.appendValueInput("expr").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("On change of");
    this.appendStatementInput("statements").setCheck(["Boolean", "Number", "String"]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("Executes the block if the watchedValue changes");
 this.setHelpUrl("");
  }
};

Blockly.Lua['onchangeof'] = function(block) {
  var value_expr = Blockly.Lua.valueToCode(block, 'expr', Blockly.Lua.ORDER_ATOMIC);
  var statements_statements = Blockly.Lua.statementToCode(block, 'statements');

  var lastValue = "_G." + Blockly.Lua.nameDB_.getDistinctName('lastValue', Blockly.Variables.NAME_TYPE);

  var code = "actValue = " + value_expr + '\n';
  code = code + 'if(' + lastValue + ' ~= actValue ) then ' + lastValue + ' = actValue\n';
  code = code + statements_statements;
  code = code + 'end\n';
  
  return code;
};

actions.push({"kind": "block",  "type": "onchangeof"})
//-------------------------------------------------------------------

Blockly.Blocks['sendcommand'] = {
    init: function() {
      this.appendDummyInput().appendField("send command to radio");
      this.appendValueInput("cmd").setCheck("Array").setAlign(Blockly.ALIGN_RIGHT).appendField("command");
      this.appendValueInput("data").setCheck("Array").setAlign(Blockly.ALIGN_RIGHT).appendField("data");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);

      this.setColour(230);
   this.setTooltip("Sends the given command to the radio");
   this.setHelpUrl("");
    }
  };
Blockly.Lua['sendcommand'] = function(block) {
    var value_cmd = Blockly.Lua.valueToCode(block, 'cmd', Blockly.Lua.ORDER_ATOMIC);
    var value_data = Blockly.Lua.valueToCode(block, 'data', Blockly.Lua.ORDER_ATOMIC);
    var code = 'sendCommand(' + value_cmd + ', ' + value_data + ')\n';
    return code;
};
actions.push({"kind": "block",  "type": "sendcommand"})

//-------------------------------------------------------------------
Blockly.Blocks['setanalogoutput'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Set")
            .appendField(new Blockly.FieldDropdown([["PIN A","PIN_A"], ["PIN B","PIN_B"]]), "pinname");
        this.appendValueInput("newvalue")
            .setCheck("Number")
            .appendField("to Voltage");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Sets the given pin to the selected value");
        this.setHelpUrl("");
    }
};

Blockly.Lua['setanalogoutput'] = function(block) {
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var newValue =  Blockly.Lua.valueToCode(block, 'newvalue', Blockly.Lua.ORDER_ATOMIC);
    var code = 'setAnalogOutput(' + desiredPin + ', ' + newValue + ')\n';
    return code;
};

actions.push({"kind": "block",  "type": "setanalogoutput"})

//-------------------------------------------------------------------
Blockly.Blocks['setdigitaloutput'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Set")
            .appendField(new Blockly.FieldDropdown([["PIN A","PIN_A"], ["PIN B","PIN_B"], ["PIN C","PIN_C"], ["PIN D","PIN_D"], ["PIN E","PIN_E"], ["PIN F","PIN_F"], ["PIN G","PIN_G"], ["PIN H","PIN_H"]]), "pinname");
        this.appendValueInput("newvalue")
            .setCheck("Boolean")
            .appendField("to Value");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Sets the digital output to high (true) or low (false)");
        this.setHelpUrl("");
    }
};

Blockly.Lua['setdigitaloutput'] = function(block) {
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var newValue =  Blockly.Lua.valueToCode(block, 'newvalue', Blockly.Lua.ORDER_ATOMIC);
    var code = 'setDigitalOutput(' + desiredPin + ', ' + newValue + ')\n';
    return code;
};

actions.push({"kind": "block",  "type": "setdigitaloutput"})

//-------------------------------------------------------------------
Blockly.Blocks['wait'] = {
    init: function() {
        this.jsonInit({
            "type": "wait",
            "message0": "Wait %1 %2 ms",
            "args0": [
            {"type": "input_dummy"},
            {"type": "input_value",  "name": "timeout", "check": "Number" }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "colour": 230,
            "tooltip": "Waits for x milliseconds",
            "helpUrl": ""
        });
        var thisBlock = this;
        this.setTooltip("Waits for x milliseconds");
    }
};

Blockly.Lua['wait'] = function(block) {
    var number_timeout = block.getFieldValue('timeout');
    var value_timeout = Blockly.Lua.valueToCode(block, 'timeout', Blockly.Lua.ORDER_ATOMIC);
    var code = 'wait(' + value_timeout + ')\n';
    return code;
};

actions.push({"kind": "block",  "type": "wait"})

//-------------------------------------------------------------------

Blockly.Blocks['executeluachunk'] = {
    init: function() {
        this.appendDummyInput().appendField("execute Lua Chunk");
        this.appendValueInput("chunk").setCheck("String");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Runs the given Lua Script");
        this.setHelpUrl("https://www.lua.org/manual/5.3/");
    }
};

Blockly.Lua['executeluachunk'] = function(block) 
{
    var value_script = Blockly.Lua.valueToCode(block, 'chunk', Blockly.Lua.ORDER_ATOMIC);
    var code = 'load(' + value_script + ')()\n';
    return code;
};

actions.push({"kind": "block",  "type": "executeluachunk"})

//-------------------------------------------------------------------

Blockly.Blocks['configserial'] = {
    init: function() {
        this.jsonInit({
            "message0": "Set serial speed to  %1,8,N,1",
            "args0": [
                {   "type": "field_dropdown",
                    "name": "speed",
                    "options": [["110","110"],["300","300"],["600","600"],["1200","1200"],
                                ["2400","2400"],["4800","4800"],["9600","9600"],
                                ["14400","14400"],["19200","19200"],["38400","38400"],
                                ["57600","57600"],["115200","115200"]]
                },          
            ],
            "colour": 230,
            "previousStatement": null,
            "nextStatement": null,
            });
            var thisBlock = this;
            this.setTooltip("Sets the speed of the serial port");
        }
    };

Blockly.Lua['configserial'] = function(block) 
{
    var value_speed = block.getFieldValue('speed');
    var code = 'configSerial(' + value_speed + ')\n';
    return code;
};

actions.push({"kind": "block",  "type": "configserial"})
/* **************************************************************** */
/*                          PROPERTIES                              */
/* **************************************************************** */

Blockly.Blocks['readdata'] = {
    init: function() {
        this.appendDummyInput().appendField("Read data from radio");
        this.appendValueInput("commandsequence").setCheck("Array");
        this.setOutput(true, "Array");
        this.setColour(230);
        this.setTooltip("Returns the plain resultarray of the given command");
        this.setHelpUrl("");
    }
};
Blockly.Lua['readdata'] = function(block) {
    var value_command = Blockly.Lua.valueToCode(block, 'commandsequence', Blockly.Lua.ORDER_ATOMIC);
    var code = 'readResultOfCommand(sendCommand(' + value_command + '))';
    return [code, Blockly.Lua.ORDER_NONE];
};
properties.push({"kind": "block",  "type": "readdata"})

//-------------------------------------------------------------------
Blockly.Blocks['readanaloginput'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Voltage of")
            .appendField(new Blockly.FieldDropdown(([["PIN A","PIN_A"], ["PIN B","PIN_B"], ["PIN C","PIN_C"], ["PIN D","PIN_D"], ["PIN E","PIN_E"], ["PIN F","PIN_F"], ["PIN G","PIN_G"], ["PIN H","PIN_H"]])), "pinname");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Read the value of the given input in mV");
        this.setHelpUrl("");
    }
};

Blockly.Lua['readanaloginput'] = function(block) {
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var code = 'readAnalogInput(' + desiredPin + ')';
    return [code, Blockly.Lua.ORDER_RELATIONAL];
};

properties.push({"kind": "block",  "type": "readanaloginput"})

//-------------------------------------------------------------------
Blockly.Blocks['readdigitalinput'] = {
init: function() {
        this.appendDummyInput()
            .appendField("State of")
            .appendField(new Blockly.FieldDropdown([["PIN A","PIN_A"], ["PIN B","PIN_B"], ["PIN C","PIN_C"], ["PIN D","PIN_D"], ["PIN E","PIN_E"], ["PIN F","PIN_F"], ["PIN G","PIN_G"], ["PIN H","PIN_H"]]), "pinname");
        this.setOutput(true, "Boolean");
        this.setColour(230);
        this.setTooltip("Read the value of the given input");
        this.setHelpUrl("");
    }
};

Blockly.Lua['readdigitalinput'] = function(block) {
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var code = 'readDigitalInput(' + desiredPin + ')';
    return [code, Blockly.Lua.ORDER_RELATIONAL];
};

properties.push({"kind": "block",  "type": "readdigitalinput"})

//-------------------------------------------------------------------
Blockly.Blocks['millis'] = 
{
    init: function() {
        this.appendDummyInput().appendField("milliseconds since start");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("returns the milliseconds since the device was started. Rolls over after ~57 days");
        this.setHelpUrl("");
    }
};

Blockly.Lua['millis'] = function(block) 
{
    var code = 'millis()';
    return [code, Blockly.Lua.ORDER_NONE];
};
properties.push({"kind": "block",  "type": "millis"})

//-------------------------------------------------------------------
Blockly.Blocks['touchvalue'] = {
    init: function() {
        this.jsonInit({
            "message0": "Touch value of %1",
            "args0": [
                {   "type": "field_dropdown",
                    "name": "pinname",
                    "options": [["PIN C","PIN_C"],["PIN D","PIN_D"],["PIN E","PIN_E"],
                                ["PIN F","PIN_F"],["PIN G","PIN_G"],["PIN H","PIN_H"]]
                },          
            ],
            "colour": 230,
            });
            this.setOutput(true, "Number");
            this.setTooltip("Reads the touch value of a pin");
        }
    };

Blockly.Lua['touchvalue'] = function(block) 
{
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var code = 'readTouchInput(' + desiredPin + ')';
    return [code, Blockly.Lua.ORDER_RELATIONAL];
};

properties.push({"kind": "block",  "type": "touchvalue"})

//-------------------------------------------------------------------
Blockly.Blocks['isTouched'] = {
    init: function() {
        this.jsonInit({
            "message0": "Is %1 %2 ?",
            "args0": [
                {   "type": "field_dropdown",
                    "name": "pinname",
                    "options": [["PIN C","PIN_C"],["PIN D","PIN_D"],["PIN E","PIN_E"],
                                ["PIN F","PIN_F"],["PIN G","PIN_G"],["PIN H","PIN_H"]]
                },      
                {   "type": "field_dropdown",
                    "name": "threshold",
                    "options": [["touched","< 30"],["released",">= 30"]]
                },                     
            ],
            "colour": 230,
            });
            this.setOutput(true, "Boolean");
            this.setTooltip("Retruns true if a pin has been touched");
        }
    };

Blockly.Lua['isTouched'] = function(block) 
{
    var desiredPin = Blockly.Lua.nameDB_.getName(block.getFieldValue('pinname'), Blockly.Names.NameType.VARIABLE);
    var threshold =  block.getFieldValue('threshold');
    var code = '(readTouchInput(' + desiredPin + ') ' + threshold + ')';
    return [code, Blockly.Lua.ORDER_RELATIONAL];
};

properties.push({"kind": "block",  "type": "isTouched"})

/* **************************************************************** */
/*                          HELPERS                                 */
/* **************************************************************** */
Blockly.Blocks['comment'] = {
  init: function() {
    this.jsonInit({
        "type": "comment",
        "message0": "Comment: %1",
        "args0": [
            {"type": "field_input",  "name": "theContent", "check": "String" }
        ],
        "inputsInline": false,
        "previousStatement": null,
        "nextStatement": null,
        "colour": 120,
        "helpUrl": ""
    });
    var thisBlock = this;
    this.setTooltip("Does nothing, is just for commenting");
  }
};
Blockly.Lua['comment'] = function(block) {
    var theComment = block.getFieldValue('theContent');
    return "-- " + theComment + "\n";
};

helpers.push({"kind": "block",  "type": "comment"})
//-------------------------------------------------------------------
Blockly.Blocks['voltagevalue'] = {
init: function() {
    this.jsonInit({
        "message0": "%1 %2",
        "args0": [
            {"type": "input_value",     "name": "voltage", "check": "Number"},
            {"type": "field_dropdown",  "name": "vunit",
                "options": [["V", "1"],["mV", "0.001"]]
            }          
        ],
        "output": "Number",
        "colour": 230
        });
        var thisBlock = this;
        this.setTooltip("Voltage representation");
    }
};

Blockly.Lua['voltagevalue'] = function(block) {
    var voltageValue = Blockly.Lua.valueToCode(block, 'voltage', Blockly.Lua.ORDER_ATOMIC);
    var dropdown_unit = block.getFieldValue('vunit');
    var code = voltageValue * parseFloat(dropdown_unit);
    return [code, Blockly.Lua.ORDER_NONE];
};

helpers.push({"kind": "block",  "type": "voltagevalue"})

//-------------------------------------------------------------------
Blockly.Blocks['prettystring'] = {
  init: function() {
    this.appendValueInput("inputarray")
        .setCheck("Array")
        .appendField("pretty");
    this.setOutput(true, "String");
    this.setColour(230);
 this.setTooltip("Converts a list to a string with hex values");
 this.setHelpUrl("");
  }
};

Blockly.Lua['prettystring'] = function(block) {
  
    var inarray = Blockly.Lua.valueToCode(block, 'inputarray', Blockly.Lua.ORDER_ATOMIC);

    use('pretty'); 
  
    // Generate the function call for this block.
    var code =  'pretty(' + inarray + ')';
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

helpers.push({"kind": "block",  "type": "prettystring"})

//-------------------------------------------------------------------
Blockly.Blocks['bcdasnumber'] = {
  init: function() {
    this.appendValueInput("inputarray")
        .setCheck("Array")
        .appendField("BCD values as Number");
    this.setOutput(true, "Number");
    this.setColour(230);
 this.setTooltip("Converts of bcd hex values to the corrsponding number");
 this.setHelpUrl("");
  }
};

Blockly.Lua['bcdasnumber'] = function(block) {
  
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', Blockly.Lua.ORDER_ATOMIC);
  use('bcdAsNumber');

  // Generate the function call for this block.
  var code = 'bcdAsNumber(' + inarray + ')';
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

helpers.push({"kind": "block",  "type": "bcdasnumber"})

//-------------------------------------------------------------------

Blockly.Blocks['mapnumber'] = {
  init: function() {
    this.appendValueInput("val").setCheck("Number").appendField("map");
    this.appendValueInput("in_min").setCheck("Number").appendField("from range of");
    this.appendValueInput("in_max").setCheck("Number").appendField("-");
    this.appendValueInput("out_min").setCheck("Number").appendField("to range from");
    this.appendValueInput("out_max").setCheck("Number").appendField("-");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(230);
 this.setTooltip("Maps a number from one range into another (by linear intra/extrapolation).");
 this.setHelpUrl("");
  }
};

Blockly.Lua['mapnumber'] = function(block) {
  var value_val = Blockly.Lua.valueToCode(block, 'val', Blockly.Lua.ORDER_ATOMIC);
  var value_in_min = Blockly.Lua.valueToCode(block, 'in_min', Blockly.Lua.ORDER_ATOMIC);
  var value_in_max = Blockly.Lua.valueToCode(block, 'in_max', Blockly.Lua.ORDER_ATOMIC);
  var value_out_min = Blockly.Lua.valueToCode(block, 'out_min', Blockly.Lua.ORDER_ATOMIC);
  var value_out_max = Blockly.Lua.valueToCode(block, 'out_max', Blockly.Lua.ORDER_ATOMIC);

  use('map');
      
  // Generate the function call for this block.
  var code = 'map(' + value_val  + ', ' + value_in_min + ', '+ value_in_max + ', ' + value_out_min + ', ' + value_out_max + ')';
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

helpers.push({"kind": "block",  "type": "mapnumber"})



//-------------------------------------------------------------------
Blockly.Blocks['asChar'] = {
    init: function() {
      this.appendValueInput("inByte")
          .setCheck("Number")
          .appendField("char of");
      this.setOutput(true, "String");
      this.setColour(230);
   this.setTooltip("Converts the number to a character");
   this.setHelpUrl("");
    }
  };
  
  Blockly.Lua['asChar'] = function(block) {
    
    var inbyte = Blockly.Lua.valueToCode(block, 'inByte', Blockly.Lua.ORDER_ATOMIC);
    // Generate the function call for this block.
    var code = 'string.char(' + inbyte + ')'; 
    return [code, Blockly.Lua.ORDER_ATOMIC];
  };
  
  helpers.push({"kind": "block",  "type": "asChar"})

  //-------------------------------------------------------------------
  

  // map     


//-------------------------------------------------------------------
// Finally add the blocks to the toolbox
//-------------------------------------------------------------------

// Add all the events
contribution.contents.push({"kind": "label", "text" : "Events" });
events.forEach((event) => contribution.contents.push(event));

// Add all the actions
contribution.contents.push({"kind": "label", "text" : "Actions" });
contribution.contents.push({"kind": "block",  "type": "text_print"});
actions.forEach((action) => contribution.contents.push(action));

// Add all the properties
contribution.contents.push({"kind": "label", "text" : "Properties" });
properties.forEach((property) => contribution.contents.push(property));

// Add all the helpers
contribution.contents.push({"kind": "label", "text" : "Helpers" });
helpers.forEach((helper) => contribution.contents.push(helper));

// Add the things within this file to the toolbox
toolbox.contents.push(contribution);

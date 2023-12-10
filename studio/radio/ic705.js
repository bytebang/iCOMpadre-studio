// Create a main 
contribution = {
  "kind": "category",  "name": "IC-705",
  "contents": []
};

// Insert menu contributions in these arrays
// they will be added to the menu at the end 
events = [];
actions = [];
properties = [];
helpers = [];


// Additional helping functions -> can be used with the use(...) function
utilityfunctions['getOperatingModeString'] = [
  'function getOperatingModeString(responseTable)',
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
  "  }",
  '  return modeMap[reponseByte] or "Unknown"',
  "end"
];

/* **************************************************************** */
/*                          EVENTS                                  */
/* **************************************************************** */

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          ACTIONS                                 */
/* **************************************************************** */

Blockly.Blocks['test'] = {
  init: function() {
    this.appendValueInput("inputarray")
        .setCheck("Array")
        .appendField("test");
    this.setOutput(true, "Number");
    this.setColour(230);
 this.setTooltip("Test");
 this.setHelpUrl("");
  }
};

Blockly.Lua['test'] = function(block) {
  
  var inarray = Blockly.Lua.valueToCode(block, 'inputarray', Blockly.Lua.ORDER_ATOMIC);
  
    use(['pretty', 'map']);

    var code = 'pretty(' + inarray + ')';
    return [code, Blockly.Lua.ORDER_FUNCTION_CALL];
};

helpers.push({"kind": "block",  "type": "test"})

//-------------------------------------------------------------------

Blockly.Blocks['ic705_set_af_level'] = {
  init: function() {
    this.jsonInit({
      "type": "wait",
      "message0": "Set AF Level to %1 %2 %%",
      "args0": [
        {"type": "input_dummy"},
        {
          "type": "input_value",
          "name": "level",
          "check": "Number",
          "align": "RIGHT",
          "alignConnector": "RIGHT"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 230,
      "tooltip": "Sets the AF output",
      "helpUrl": ""
    });
    this.setTooltip("Sets the AF output level");
  },
  onchange: function() {
    var inputBlock = this.getInputTargetBlock('level');
    if (inputBlock) {
      var level = inputBlock.getFieldValue('NUM');
      if (level < 0 || level > 100) {
        this.setWarningText("AF level must be between 0 and 100%");
      } else {
        this.setWarningText(null);
      }
    }
  }
}; 

Blockly.Lua['ic705_set_af_level'] = function(block) {
  var level = Blockly.Lua.valueToCode(block, 'level', Blockly.Lua.ORDER_ATOMIC);
  use(['numberToBcd','map']);
  var code = 'sendCommand({0x14, 0x01},numberToBcd(map(' + level + ',0,100,0,255),2))\n';
  return code;
};

actions.push({"kind": "block", "type": "ic705_set_af_level"});

//-------------------------------------------------------------------
Blockly.Blocks['ic705_set_frequency'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Frequency to %1 %2",
      "args0": [
        {
          "type": "input_value",
          "name": "FREQUENCY",
          "check": "Number"
        },
        {
          "type": "field_dropdown",
          "name": "UNIT",
          "options": [
            ["Hz", "1"],
            ["kHz", "1e3"],
            ["MHz", "1e6"]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 300,
      "tooltip": "Sets the frequency of the radio"
    });
  }
};

Blockly.Lua['ic705_set_frequency'] = function(block) {
  var frequency = Blockly.Lua.valueToCode(block, 'FREQUENCY', Blockly.Lua.ORDER_ATOMIC);
  var unit = block.getFieldValue('UNIT');
  use(['frequencyToBcd']);
  var code = 'sendCommand({0x05}, frequencyToBcd(' + frequency + '*' + unit + ',5))';  
  return code + ';\n';
};

actions.push({"kind": "block", "type": "ic705_set_frequency"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_set_operating_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Operating Mode to %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            ["LSB", "0x00"],
            ["USB", "0x01"],
            ["AM", "0x02"],
            ["CW", "0x03"],
            ["RTTY", "0x04"],
            ["FM", "0x05"],
            ["WFM", "0x06"],
            ["CW-R", "0x07"],
            ["RTTY-R", "0x08"],
            ["DV", "0x17"]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 350,
      "tooltip": "Sets the operating mode of the radio"
    });
  }
};

Blockly.Lua['ic705_set_operating_mode'] = function(block) {
  var mode = block.getFieldValue('MODE');
  var code = 'sendCommand({0x06}, ' + mode + ')'; 
  return code + ';\n';
};

actions.push({"kind": "block", "type": "ic705_set_operating_mode"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_set_rf_gain'] = {
  init: function() {
    this.jsonInit({
      "type": "wait",
      "message0": "Set RF Gain to %1 %%",
      "args0": [
        {
          "type": "input_value",
          "name": "gain",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 230,
      "tooltip": "Sets the RF gain level",
      "helpUrl": ""
    });
    this.setTooltip("Sets the RF gain level");
  },
  onchange: function() {
    var inputBlock = this.getInputTargetBlock('gain');
    if (inputBlock) {
      var gain = inputBlock.getFieldValue('NUM');
      if (gain < 0 || gain > 100) {
        this.setWarningText("RF gain must be between 0 and 100%");
      } else {
        this.setWarningText(null);
      }
    }
  }
};

Blockly.Lua['ic705_set_rf_gain'] = function(block) {
  var gain = Blockly.Lua.valueToCode(block, 'gain', Blockly.Lua.ORDER_ATOMIC);
  use(['numberToBcd', 'map']);
  var code = 'sendCommand({0x14, 0x02},numberToBcd(map(' + gain + ',0,100,0,255),2))\n';  // Send the command with RF gain value
  return code;
};

actions.push({"kind": "block", "type": "ic705_set_rf_gain"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_set_squelch_level'] = {
  init: function() {
    this.jsonInit({
      "type": "wait",
      "message0": "Set Squelch Level to %1 %%",
      "args0": [
        {
          "type": "input_value",
          "name": "level",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 230,
      "tooltip": "Sets the squelch level",
      "helpUrl": ""
    });
    this.setTooltip("Sets the squelch level");
  },
  onchange: function() {
    var inputBlock = this.getInputTargetBlock('level');
    if (inputBlock) {
      var level = inputBlock.getFieldValue('NUM');
      if (level < 0 || level > 100) {
        this.setWarningText("Squelch level must be between 0 and 100%");
      } else {
        this.setWarningText(null);
      }
    }
  }
};

Blockly.Lua['ic705_set_squelch_level'] = function(block) {
  var level = Blockly.Lua.valueToCode(block, 'level', Blockly.Lua.ORDER_ATOMIC);
  use(['numberToBcd', 'map']);
  var code = 'sendCommand({0x14, 0x03}, numberToBcd(map(' + level + ', 0, 100, 0, 255), 2))\n';  // Send the command with squelch level value
  return code;
};

actions.push({"kind": "block", "type": "ic705_set_squelch_level"});
//-------------------------------------------------------------------
Blockly.Blocks['ic705_set_mic_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Mic Gain to %1 %%",
      "args0": [
        {
          "type": "input_value",
          "name": "LEVEL",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 240,
      "tooltip": "Sets the mic gain level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_set_mic_gain'] = function(block) {
  var level = Blockly.Lua.valueToCode(block, 'LEVEL', Blockly.Lua.ORDER_ATOMIC);
  use(['map', 'numberToBcd']);
  var code = 'sendCommand({0x14, 0x0B, numberToBcd(map(' + level + ', 0, 100, 0, 255))})'; 
  return code + ';\n';
};
actions.push({"kind": "block", "type": "ic705_set_mic_gain"});
//-------------------------------------------------------------------
Blockly.Blocks['ic705_set_tuning_step'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set Tuning Step to %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "STEP",
          "options": [
            ["OFF (10Hz or 1Hz)", "0x00"],
            ["100Hz", "0x01"],
            ["500Hz", "0x02"],
            ["1kHz", "0x03"],
            ["5kHz", "0x04"],
            ["6.25kHz", "0x05"],
            ["8.33kHz", "0x06"],
            ["9kHz", "0x07"],
            ["10kHz", "0x08"],
            ["12.5kHz", "0x09"],
            ["20kHz", "0x0A"],
            ["25kHz", "0x0B"],
            ["50kHz", "0x0C"],
            ["100kHz", "0x0D"]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 280,
      "tooltip": "Sets the tuning step of the radio"
    });
  }
};

Blockly.Lua['ic705_set_tuning_step'] = function(block) {
  var step = block.getFieldValue('STEP');
  var code = 'sendCommand({0x10, ' + step + '})';  
  return code + ';\n';
};

actions.push({"kind": "block", "type": "ic705_set_tuning_step"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_select_vfo_a'] = {
  init: function() {
    this.jsonInit({
      "message0": "Select VFO A",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 310,
      "tooltip": "Selects VFO A on the radio"
    });
  }
};

Blockly.Lua['ic705_select_vfo_a'] = function(block) {
  var code = 'sendCommand({0x07, 0x00})'; 
  return code + ';\n';
};

actions.push({"kind": "block", "type": "ic705_select_vfo_a"});

//-------------------------------------------------------------------
Blockly.Blocks['ic705_select_vfo_b'] = {
  init: function() {
    this.jsonInit({
      "message0": "Select VFO B",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 320,
      "tooltip": "Selects VFO B on the radio"
    });
  }
};

Blockly.Lua['ic705_select_vfo_b'] = function(block) {
  var code = 'sendCommand({0x07, 0x01})'; 
  return code + ';\n';
};


actions.push({"kind": "block", "type": "ic705_select_vfo_b"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_equalize_vfo'] = {
  init: function() {
    this.jsonInit({
      "message0": "Equalize VFO A and VFO B",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 330,
      "tooltip": "Equalizes the settings of VFO A and VFO B"
    });
  }
};

Blockly.Lua['ic705_equalize_vfo'] = function(block) {
  var code = 'sendCommand({0x07, 0xA0})'; 
  return code + ';\n';
};
actions.push({"kind": "block", "type": "ic705_equalize_vfo"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_exchange_vfo'] = {
  init: function() {
    this.jsonInit({
      "message0": "Exchange VFO A and VFO B",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 340,
      "tooltip": "Exchanges the frequencies and settings of VFO A and VFO B"
    });
  }
};

Blockly.Lua['ic705_exchange_vfo'] = function(block) {
  var code = 'sendCommand({0x07, 0xB0})'; 
  return code + ';\n';
};

actions.push({"kind": "block", "type": "ic705_exchange_vfo"});
//-------------------------------------------------------------------

Blockly.Blocks['ic705_set_lcd_brightness'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set LCD Brightness to %1 %%",
      "args0": [
        {
          "type": "input_value",
          "name": "LEVEL",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 260,
      "tooltip": "Sets the LCD brightness level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_set_lcd_brightness'] = function(block) {
  var level = Blockly.Lua.valueToCode(block, 'LEVEL', Blockly.Lua.ORDER_ATOMIC);
  use(['map', 'numberToBcd']);
  var code = 'sendCommand({0x14, 0x19, numberToBcd(map(' + level + ', 0, 100, 0, 255))})'; 
  return code + ';\n';
};
actions.push({"kind": "block", "type": "ic705_set_lcd_brightness"});
//-------------------------------------------------------------------

/* **************************************************************** */
/*                          PROPERTIES                              */
/* **************************************************************** */

Blockly.Blocks['ic705_get_swr_meter_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "SWR Meter Level",
      "output": "Number",
      "colour": 270,
      "tooltip": "Reads the current SWR Meter level of the radio"
    });
  }
};

Blockly.Lua['ic705_get_swr_meter_level'] = function(block) {
  use(['bcdToNumber']);
  var code = 'bcdToNumber(readResultOfCommand(sendCommand({0x15, 0x12})))';  
  return [code, Blockly.Lua.ORDER_ATOMIC];
};
properties.push({"kind": "block",  "type": "ic705_get_swr_meter_level"})
//-------------------------------------------------------------------

Blockly.Blocks['ic705_get_lcd_brightness'] = {
  init: function() {
    this.jsonInit({
      "message0": "LCD Brightness",
      "output": "Number",
      "colour": 260,
      "tooltip": "Reads the current LCD brightness level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_get_lcd_brightness'] = function(block) {
  use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x19}))), 0, 255, 0, 100))';  
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block",  "type": "ic705_get_lcd_brightness"})
//-------------------------------------------------------------------

Blockly.Blocks['ic705_get_mic_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "Mic Gain",
      "output": "Number",
      "colour": 240,
      "tooltip": "Reads the current mic gain level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_get_mic_gain'] = function(block) {
  use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x0B}))), 0, 255, 0, 100))'; 
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block",  "type": "ic705_get_mic_gain"})
//-------------------------------------------------------------------

Blockly.Blocks['ic705_get_operating_frequency'] = {
  init: function() {
      this.jsonInit({
          "message0": "operating frequency in %1",
          "args0": [
              {   "type": "field_dropdown",
                  "name": "unit",
                  "options": [["Hz","1"],["kHz","1e3"],["MHz","1e6"]]
              },          
          ],
          "colour": 230,
          });
          this.setOutput(true, "Number");
          this.setTooltip("Reads the current frequency of the radio");
      }
  };

Blockly.Lua['ic705_get_operating_frequency'] = function(block) 
{
  var desiredUnit = block.getFieldValue('unit');
  use(['frequencyAsNumber']);
  var code = 'frequencyAsNumber(readResultOfCommand(sendCommand({3})))/' + block.getFieldValue('unit');
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block",  "type": "ic705_get_operating_frequency"})
//-------------------------------------------------------------------

Blockly.Blocks['ic705_get_operating_mode'] = {
  init: function() {
    this.jsonInit({
      "message0": "Get Operating Mode",
      "output": "String",
      "colour": 360,
      "tooltip": "Gets the current operating mode of the radio"
    });
  }
};

Blockly.Lua['ic705_get_operating_mode'] = function(block) {
  use("getOperatingModeString");
  var code = 'getOperatingModeString(readResultOfCommand(sendCommand({0x04})))';  
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block", "type": "ic705_get_operating_mode"});

//-------------------------------------------------------------------
Blockly.Blocks['ic705_get_af_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "AF Level",
      "output": "Number",
      "colour": 230,
      "tooltip": "Reads the current AF level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_get_af_level'] = function(block) {
  use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x01}))),0,255,0,100))';  // Command to retrieve AF level in %
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block", "type": "ic705_get_af_level"});

//-------------------------------------------------------------------
Blockly.Blocks['ic705_get_rf_gain'] = {
  init: function() {
    this.jsonInit({
      "message0": "RF Gain",
      "output": "Number",
      "colour": 230,
      "tooltip": "Reads the current RF gain level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_get_rf_gain'] = function(block) {
  use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x02}))), 0, 255, 0, 100))';  // Command to retrieve RF gain level in %
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block", "type": "ic705_get_rf_gain"});

//-------------------------------------------------------------------
Blockly.Blocks['ic705_get_squelch_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Squelch Level",
      "output": "Number",
      "colour": 230,
      "tooltip": "Reads the current squelch level of the radio (in %)"
    });
  }
};

Blockly.Lua['ic705_get_squelch_level'] = function(block) {
  use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x03}))), 0, 255, 0, 100))';  // Command to retrieve squelch level in %
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block", "type": "ic705_get_squelch_level"});
//-------------------------------------------------------------------
/* **************************************************************** */
/*                          HELPERS                                 */
/* **************************************************************** */


//-------------------------------------------------------------------
// Finally add the blocks to the toolbox
//-------------------------------------------------------------------

// Add all the events
contribution.contents.push({"kind": "label", "text" : "Events" });
events.forEach((event) => contribution.contents.push(event));

// Add all the actions
contribution.contents.push({"kind": "label", "text" : "Actions" });
actions.forEach((action) => contribution.contents.push(action));

// Add all the properties
contribution.contents.push({"kind": "label", "text" : "Properties" });
properties.forEach((property) => contribution.contents.push(property));

// Add all the helpers
contribution.contents.push({"kind": "label", "text" : "Helpers" });
helpers.forEach((helper) => contribution.contents.push(helper));

// Add the things within this file to the toolbox
toolbox.contents.push(contribution);

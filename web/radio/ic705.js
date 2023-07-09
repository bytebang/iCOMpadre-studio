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
    // Generate the function call for this block.
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
/* **************************************************************** */
/*                          PROPERTIES                              */
/* **************************************************************** */
Blockly.Blocks['ic705_getfrequency'] = {
  init: function() {
      this.jsonInit({
          "message0": "current frequency in %1",
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

Blockly.Lua['ic705_getfrequency'] = function(block) 
{
  var desiredUnit = block.getFieldValue('unit');
  use(['frequencyAsNumber']);
  var code = 'frequencyAsNumber(readResultOfCommand(sendCommand({3})))/' + block.getFieldValue('unit');
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

properties.push({"kind": "block",  "type": "ic705_getfrequency"})

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

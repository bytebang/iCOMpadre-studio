// Template for a new radio. See DEVELOPING.md for the step by step guide.
//
// 1. Copy this file to radio/<radio>.js (e.g. radio/ic7300.js)
// 2. Replace "myradio" / "My Radio" with the name of your radio
// 3. Include the file in studio/index.html (after base.js) and in the preloader list of ../index.html
// 4. Document the blocks in documentation/blocks/radio/<radio>.md (same name as this file)
//
// Conventions:
// - Block types are prefixed with the radio: "myradio_set_af_level"
// - Use jsonInit() for the block definition and set the tooltip only there
// - Every generator states the CI-V command it sends (see the CI-V reference guide of the radio)
// - Don't set a helpUrl: every block links automatically to the heading with its block type
//   in documentation/blocks/radio/<radio>.md, e.g. "## Set AF Level {#myradio_set_af_level}"

// Register the contribution of this file
var myradio = Studio.category("My Radio");

// Additional helping functions -> can be used with the Studio.use(...) function
// Common functions (map, numberToBcd, bcdToNumber, frequencyToBcd, ...) are registered in base.js
Studio.luaFunction('myradioPercentToLevel', [
  'function myradioPercentToLevel(percent)',
  '  return numberToBcd(map(percent, 0, 100, 0, 255), 2)',
  'end'
]);

/* **************************************************************** */
/*                          EVENTS                                  */
/* **************************************************************** */

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          ACTIONS                                 */
/* **************************************************************** */

// Example action block: sets the AF level of the radio.
// CI-V: 0x14 0x01 + level as 2 byte BCD (0000 = min .. 0255 = max)
Blockly.Blocks['myradio_set_af_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "Set AF Level to %1 %%",
      "args0": [
        {"type": "input_value", "name": "level", "check": "Number"}
      ],
      "inputsInline": true,
      "previousStatement": null,   // action blocks can be stacked ...
      "nextStatement": null,       // ... above and below each other
      "colour": 230,
      "tooltip": "Sets the AF output level (0 - 100 %)"
    });
  },
  // Optional: warn the user about invalid values while editing
  onchange: function() {
    var inputBlock = this.getInputTargetBlock('level');
    var level = inputBlock ? inputBlock.getFieldValue('NUM') : null;
    if (level !== null && (level < 0 || level > 100)) {
      this.setWarningText("AF level must be between 0 and 100%");
    } else {
      this.setWarningText(null);
    }
  }
};

// Lua generator of an action block: returns a statement (string, ending with a newline)
Blockly.Lua['myradio_set_af_level'] = function(block) {
  var level = Blockly.Lua.valueToCode(block, 'level', Blockly.Lua.ORDER_ATOMIC);
  Studio.use(['map', 'numberToBcd', 'myradioPercentToLevel']); // pull the lua helpers into main.lua
  return 'sendCommand({0x14, 0x01}, myradioPercentToLevel(' + level + '))\n';
};

myradio.action("myradio_set_af_level");

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          PROPERTIES                              */
/* **************************************************************** */

// Example property block: reads the AF level of the radio.
// CI-V: 0x14 0x01 -> response contains the level as 2 byte BCD (0000 .. 0255)
Blockly.Blocks['myradio_get_af_level'] = {
  init: function() {
    this.jsonInit({
      "message0": "AF Level",
      "output": "Number",          // property blocks have an output instead of previous/next
      "colour": 230,
      "tooltip": "Reads the current AF level of the radio (in %)"
    });
  }
};

// Lua generator of a property block: returns [expression, operator precedence]
Blockly.Lua['myradio_get_af_level'] = function(block) {
  Studio.use(['map', 'bcdToNumber']);
  var code = 'math.floor(map(bcdToNumber(readResultOfCommand(sendCommand({0x14, 0x01}))), 0, 255, 0, 100))';
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

myradio.property("myradio_get_af_level");

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          HELPERS                                 */
/* **************************************************************** */

//-------------------------------------------------------------------

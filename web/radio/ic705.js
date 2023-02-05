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
  
    use(['pretty', 'pretty', 'map']);
    // Generate the function call for this block.
    var code = 'pretty(' + inarray + ')';
    return [code, Blockly.Lua.ORDER_FUNCTION_CALL];
};

helpers.push({"kind": "block",  "type": "test"})

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          PROPERTIES                              */
/* **************************************************************** */

//-------------------------------------------------------------------

/* **************************************************************** */
/*                          HELPERS                                 */
/* **************************************************************** */


//-------------------------------------------------------------------
// Finally add the blocks to the toolbox
//-------------------------------------------------------------------
attribution = {
  "kind": "category",  "name": "IC-705",
  "contents": []
};

// Add all the events
attribution.contents.push({"kind": "label", "text" : "Events" });
events.forEach((event) => attribution.contents.push(event));

// Add all the actions
attribution.contents.push({"kind": "label", "text" : "Actions" });
actions.forEach((action) => attribution.contents.push(action));

// Add all the properties
attribution.contents.push({"kind": "label", "text" : "Properties" });
properties.forEach((property) => attribution.contents.push(action));

// Add all the helpers
attribution.contents.push({"kind": "label", "text" : "Helpers" });
helpers.forEach((helper) => attribution.contents.push(helper));

// Add the things within this file to the toolbox
toolbox.contents.push(attribution);

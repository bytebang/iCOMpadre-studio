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
    "kind": "category",  "name": "Addon",
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


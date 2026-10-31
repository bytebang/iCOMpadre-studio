// Registration API for blocks and lua helper functions.
//
// Every block file (base.js, radio/*.js) registers its contribution here instead
// of manipulating the toolbox directly. The toolbox is assembled once, after all
// block files have been loaded, by Studio.buildToolbox().
//
// Usage in a block file:
//
//   var ic705 = Studio.category("IC-705");
//   ic705.action("ic705_set_frequency");
//
//   Studio.luaFunction("myHelper", ["function myHelper()", "end"]);
//   ... and inside a lua generator: Studio.use(["myHelper"]);
//
// See DEVELOPING.md for a step by step guide on how to add a new radio.

/**
 * The global registry of the studio. It is the only global that block files need.
 * @namespace
 */
var Studio = (function() {

  // Sections of a category, in the order they appear in the toolbox
  var SECTIONS = [
    {"key": "events",     "label": "Events"},
    {"key": "actions",    "label": "Actions"},
    {"key": "properties", "label": "Properties"},
    {"key": "helpers",    "label": "Helpers"},
  ];

  // The documentation mirrors the block files: radio/ic705.js -> blocks/radio/ic705.md
  var HELP_ROOT = "../userguide/studio/blocks/";

  var contributions = [];   // categories and separators in registration order
  var luaFunctions = {};    // name -> array of lua source lines

  // Returns the help page of the block file which is currently executed, or null for inline scripts
  function helpPageOfCurrentScript()
  {
    var script = document.currentScript;
    var src = script ? script.getAttribute("src") : null;
    if (!src)
    {
      return null;
    }
    return HELP_ROOT + src.replace(/^\.\//, "").replace(/\.js$/, "") + "/";
  }

  // Gives every block without its own helpUrl a link to the documentation of its file
  function applyHelpUrl(blocktype, helpPage)
  {
    var definition = Blockly.Blocks[blocktype];
    if (!helpPage || !definition || definition.studioHelpApplied)
    {
      return;
    }
    var init = definition.init;
    definition.init = function() {
      init.call(this);
      if (!this.helpUrl)
      {
        this.setHelpUrl(helpPage + "#" + blocktype);
      }
    };
    definition.studioHelpApplied = true;
  }

  /**
   * Handle to fill a category of the toolbox. Every method takes the block type
   * (the key used in Blockly.Blocks[...]) and returns the handle again, so calls can be chained.
   * @typedef {Object} CategoryHandle
   * @property {function(string): CategoryHandle} event    adds an event block (OnStartup, Periodically, ...)
   * @property {function(string): CategoryHandle} action   adds an action block (changes something on the radio)
   * @property {function(string): CategoryHandle} property adds a property block (reads a value from the radio)
   * @property {function(string): CategoryHandle} helper   adds a helper block (conversions, utilities)
   */

  /**
   * Creates a new category in the toolbox.
   * Categories appear in the order in which they are created, i.e. in the order of the script tags.
   * Empty sections are not shown.
   *
   * Blocks without an own helpUrl link to the documentation of the file which created the category:
   * radio/ic705.js -> ../userguide/studio/blocks/radio/ic705/#<blocktype>
   * @param {string} name the name shown in the toolbox, e.g. "IC-705"
   * @returns {CategoryHandle} handle to add blocks to the category
   */
  function category(name)
  {
    var cat = {"name": name, "sections": {}, "helpPage": helpPageOfCurrentScript()};
    SECTIONS.forEach((section) => cat.sections[section.key] = []);
    contributions.push(cat);

    function adder(key)
    {
      return function(blocktype) {
        cat.sections[key].push({"kind": "block", "type": blocktype});
        return api;
      };
    }

    var api = {
      "event":    adder("events"),
      "action":   adder("actions"),
      "property": adder("properties"),
      "helper":   adder("helpers"),
    };
    return api;
  }

  /**
   * Adds a separator line between the categories registered before and after this call.
   */
  function separator()
  {
    contributions.push({"separator": true});
  }

  /**
   * Registers a lua function which can be pulled into the generated code via Studio.use().
   * The function is only emitted into main.lua if a block on the workspace uses it,
   * which keeps the program on the microcontroller small.
   * @param {string} name the name of the lua function. It must match the name in the first line.
   * @param {string[]} lines the lua source code, one entry per line
   */
  function luaFunction(name, lines)
  {
    if (luaFunctions[name])
    {
      console.warn("Lua function '" + name + "' is registered twice. The last one wins.");
    }
    luaFunctions[name] = lines;
  }

  /**
   * Adds the given lua function(s) to the generated code. Call it inside a Blockly.Lua generator.
   * Every function is emitted only once per program, no matter how often it is used.
   * @param {string|string[]} funcnames name or list of names registered with Studio.luaFunction()
   * @throws {Error} if a function has not been registered
   */
  function use(funcnames)
  {
    var names = Array.isArray(funcnames) ? funcnames : [funcnames];
    names.forEach(function(funcname) {
      if (!luaFunctions[funcname])
      {
        throw new Error("Unknown lua function '" + funcname + "'. Register it with Studio.luaFunction() first.");
      }
      Blockly.Lua.provideFunction_(funcname, luaFunctions[funcname]);
    });
  }

  /**
   * Returns the complete toolbox definition for Blockly.inject().
   * Called once by index.html after all block files have been loaded. It also applies the help urls.
   * @param {Object[]} baseCategories the standard blockly categories (Logic, Math, ...)
   * @returns {Object} a categoryToolbox: the base categories followed by all registered ones
   */
  function buildToolbox(baseCategories)
  {
    var contents = baseCategories.slice();

    contributions.forEach(function(contribution) {
      if (contribution.separator)
      {
        contents.push({"kind": "sep"});
        return;
      }

      var entry = {"kind": "category", "name": contribution.name, "contents": []};
      SECTIONS.forEach(function(section) {
        var blocks = contribution.sections[section.key];
        if (blocks.length == 0)
        {
          return; // no empty labels
        }
        entry.contents.push({"kind": "label", "text": section.label});
        blocks.forEach(function(block) {
          applyHelpUrl(block.type, contribution.helpPage);
          entry.contents.push(block);
        });
      });
      contents.push(entry);
    });

    return {"kind": "categoryToolbox", "contents": contents};
  }

  return {
    "category": category,
    "separator": separator,
    "luaFunction": luaFunction,
    "use": use,
    "buildToolbox": buildToolbox,
  };
})();

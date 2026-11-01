// Registration API for blocks and lua helper functions.
//
// Every block file (base.js, radio/*.js) registers its contribution here instead
// of manipulating the toolbox directly. The toolbox is assembled once, after all
// block files have been loaded, by Studio.buildToolbox().
//
// Usage in a block file:
//
//   var ic705 = Studio.category("IC-705", "radio");
//   ic705.action("ic705_set_frequency");
//
//   var base = Studio.category("iCOMpadre");
//   var pins = base.group("Pins", "pins");
//   pins.action("setdigitaloutput");
//
//   Studio.luaFunction("myHelper", ["function myHelper()", "end"]);
//   ... and inside a lua generator: Studio.use(["myHelper"]);
//
// Conventions instead of configuration:
// - the colour of a block is the style of its group (or category), see STYLES
// - the help link of a block points to the documentation of its file (or of its group, if the group has an own page)
//
// See DEVELOPING.md for a step by step guide on how to add a new radio.

/**
 * The global registry of the studio. It is the only global that block files need.
 * @namespace
 */
var Studio = (function() {

  // Sections of a category, in the order they appear in the toolbox
  var SECTIONS = [
    {"key": "events",     "label": Blockly.Msg.STUDIO_EVENTS},
    {"key": "actions",    "label": Blockly.Msg.STUDIO_ACTIONS},
    {"key": "properties", "label": Blockly.Msg.STUDIO_PROPERTIES},
    {"key": "helpers",    "label": Blockly.Msg.STUDIO_HELPERS},
  ];

  // The colour palette of the iCOMpadre blocks. The hues don't collide with the
  // standard blockly categories (logic 210, loops 120, math 230, text 160, lists 260,
  // variables 330, functions 290).
  var STYLES = {
    "program": "#e0b65e",   // sand:     events, timing, program flow
    "radio":   "#5fa8c9",   // blue:     everything that talks to the radio (CI-V)
    "pins":    "#9cc46b",   // green:    inputs and outputs of the iCOMpadre connector
    "serial":  "#b39ddb",   // lavender: serial interface
    "storage": "#e39fb6",   // rose:     files and remembered values on the SD card
    "helpers": "#a0a7ad",   // grey:     conversions and other utilities
  };

  // Register the styles in the default theme, so every workspace knows them
  Object.keys(STYLES).forEach(function(style) {
    Blockly.Themes.Classic.setBlockStyle(style + "_blocks", {"colourPrimary": STYLES[style]});
    Blockly.Themes.Classic.setCategoryStyle(style + "_category", {"colour": STYLES[style]});
  });

  // The documentation mirrors the block files: radio/ic705.js -> radio/ic705.md, base.js with its group "program" -> base/program.md
  // On the device the help is the userguide on the SD card. The online version of the studio (served by githack
  // from the repository) has no userguide next to it: it uses the online help instead, built by .github/workflows/docs.yml
  var HELP_ROOT = /(^|\.)githack\.com$/.test(location.hostname) ? "https://bytebang.github.io/iCOMpadre-studio/"
                                                                 : "../userguide/studio/";

  var contributions = [];   // categories and separators in registration order
  var luaFunctions = {};    // name -> array of lua source lines
  var eventTypes = [];      // block types registered with .event()

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

  // Applies the conventions to a block type: the style of its group and a link to its documentation
  function applyConventions(blocktype, helpPage, style)
  {
    var definition = Blockly.Blocks[blocktype];
    if (!definition || definition.studioConventionsApplied)
    {
      return;
    }
    var init = definition.init;
    definition.init = function() {
      init.call(this);
      if (style)
      {
        this.setStyle(style + "_blocks");
      }
      if (helpPage && !this.helpUrl)
      {
        this.setHelpUrl(helpPage + "#" + blocktype);
      }
    };
    definition.studioConventionsApplied = true;
  }

  // Throws if the given style is not part of the palette
  function checkStyle(style)
  {
    if (style && !STYLES[style])
    {
      throw new Error("Unknown style '" + style + "'. Use one of: " + Object.keys(STYLES).join(", "));
    }
  }

  // Creates the internal representation of a category or group
  function createContainer(name, style, helpPage)
  {
    var container = {"name": name, "style": style || null, "helpPage": helpPage, "sections": {}, "groups": []};
    SECTIONS.forEach((section) => container.sections[section.key] = []);
    return container;
  }

  // Creates the handle with which a block file fills a category or group
  function createHandle(container, allowGroups)
  {
    function adder(key)
    {
      return function(blocktype, toolboxEntry) {
        container.sections[key].push(Object.assign({"kind": "block", "type": blocktype}, toolboxEntry || {}));
        if (key == "events")
        {
          eventTypes.push(blocktype);
        }
        return handle;
      };
    }

    var handle = {
      "event":    adder("events"),
      "action":   adder("actions"),
      "property": adder("properties"),
      "helper":   adder("helpers"),
    };

    if (allowGroups)
    {
      handle.group = function(name, style, page) {
        checkStyle(style);
        var helpPage = (page && container.helpPage) ? container.helpPage + page + "/" : container.helpPage;
        var group = createContainer(name, style || container.style, helpPage);
        container.groups.push(group);
        return createHandle(group, false);
      };
    }
    return handle;
  }

  /**
   * Handle to fill a category (or group) of the toolbox. Every method takes the block type
   * (the key used in Blockly.Blocks[...]) and returns the handle again, so calls can be chained.
   * The optional second parameter is merged into the toolbox entry of the block, e.g. to give
   * an input a default value: {"inputs": {"FILE": {"shadow": {"type": "text", "fields": {"TEXT": "log.csv"}}}}}
   * @typedef {Object} CategoryHandle
   * @property {function(string, Object=): CategoryHandle} event    adds an event block (OnStartup, Periodically, ...)
   * @property {function(string, Object=): CategoryHandle} action   adds an action block (changes something on the radio)
   * @property {function(string, Object=): CategoryHandle} property adds a property block (reads a value from the radio)
   * @property {function(string, Object=): CategoryHandle} helper   adds a helper block (conversions, utilities)
   * @property {function(string, string=, string=): CategoryHandle} [group] adds a sub category with its own style (only on categories).
   *           The optional third parameter gives the group an own documentation page below the one of the category,
   *           e.g. base.group("Pins", "pins", "pins") -> ../userguide/studio/base/pins/#<blocktype>
   */

  /**
   * Creates a new category in the toolbox.
   * Categories appear in the order in which they are created, i.e. in the order of the script tags.
   * Empty sections are not shown.
   *
   * All blocks of the category get the colour of its style (radio blocks use "radio").
   * Blocks without an own helpUrl link to the documentation of the file which created the category:
   * radio/ic705.js -> ../userguide/studio/radio/ic705/#<blocktype>
   * @param {string} name the name shown in the toolbox, e.g. "IC-705"
   * @param {string=} style one of the keys of STYLES: program, radio, pins, serial, storage, helpers
   * @returns {CategoryHandle} handle to add blocks or groups to the category
   */
  function category(name, style)
  {
    checkStyle(style);
    var cat = createContainer(name, style, helpPageOfCurrentScript());
    contributions.push(cat);
    return createHandle(cat, true);
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
   * @param {string[]=} requires other registered lua functions this one calls. Studio.use() adds them as well.
   */
  function luaFunction(name, lines, requires)
  {
    if (luaFunctions[name])
    {
      console.warn("Lua function '" + name + "' is registered twice. The last one wins.");
    }
    luaFunctions[name] = {"lines": lines, "requires": requires || []};
  }

  /**
   * Adds the given lua function(s) to the generated code. Call it inside a Blockly.Lua generator.
   * Every function is emitted only once per program, no matter how often it is used.
   * The functions it requires are added as well.
   * @param {string|string[]} funcnames name or list of names registered with Studio.luaFunction()
   * @throws {Error} if a function has not been registered
   */
  function use(funcnames)
  {
    var names = Array.isArray(funcnames) ? funcnames : [funcnames];
    names.forEach(function(funcname) {
      var func = luaFunctions[funcname];
      if (!func)
      {
        throw new Error("Unknown lua function '" + funcname + "'. Register it with Studio.luaFunction() first.");
      }
      use(func.requires);
      Blockly.Lua.provideFunction_(funcname, func.lines);
    });
  }

  // Converts a category or group into its toolbox definition
  function toToolboxCategory(container)
  {
    var entry = {"kind": "category", "name": container.name, "contents": []};
    if (container.style)
    {
      entry.categorystyle = container.style + "_category";
    }

    SECTIONS.forEach(function(section) {
      var blocks = container.sections[section.key];
      if (blocks.length == 0)
      {
        return; // no empty labels
      }
      entry.contents.push({"kind": "label", "text": section.label});
      blocks.forEach(function(block) {
        applyConventions(block.type, container.helpPage, container.style);
        entry.contents.push(block);
      });
    });

    container.groups.forEach((group) => entry.contents.push(toToolboxCategory(group)));
    return entry;
  }

  /**
   * Returns the complete toolbox definition for Blockly.inject().
   * Called once by index.html after all block files have been loaded. It also applies the conventions.
   * @param {Object[]} baseCategories the standard blockly categories (Logic, Math, ...)
   * @returns {Object} a categoryToolbox: the base categories followed by all registered ones
   */
  function buildToolbox(baseCategories)
  {
    var contents = baseCategories.slice();

    contributions.forEach(function(contribution) {
      contents.push(contribution.separator ? {"kind": "sep"} : toToolboxCategory(contribution));
    });

    return {"kind": "categoryToolbox", "contents": contents};
  }

  /**
   * Warns at event blocks which are on the workspace more than once. Every event block becomes a lua function
   * (e.g. function periodically()), and a second function with the same name replaces the first one, so only
   * one of the blocks would be executed. Disabled blocks don't count, they generate no code.
   * Called by index.html whenever the sketch changes.
   * @param {Blockly.Workspace} workspace the workspace of the sketch
   */
  function checkEvents(workspace)
  {
    var blocks = workspace.getTopBlocks(false).filter(function(block) {
      return eventTypes.indexOf(block.type) >= 0;
    });
    blocks.forEach(function(block) {
      var twins = blocks.filter(function(other) {
        return other.type == block.type && other.isEnabled();
      });
      var duplicate = block.isEnabled() && twins.length > 1;
      block.setWarningText(duplicate ? Blockly.Msg.STUDIO_DUPLICATE_EVENT.replace("%1", twins.length) : null, "duplicate-event");
    });
  }

  return {
    "category": category,
    "separator": separator,
    "luaFunction": luaFunction,
    "use": use,
    "buildToolbox": buildToolbox,
    "checkEvents": checkEvents,
  };
})();

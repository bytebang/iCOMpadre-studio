# Developing iCOMpadre Studio

This guide is for people who want to extend the studio, especially by adding support for another radio.
The user facing documentation lives in [documentation/](documentation/).

## Design constraints

* The studio is served by iCOMpadre from its SD card, so it has to work **completely offline**: no CDNs, no web fonts, no online services.
* There is **no build step**. The files in `runtime/` are exactly what ends up on the SD card. Plain JavaScript, loaded via `<script>` tags.
* The device is slow at serving files. Keep the number and size of files small.

## File structure

```text
runtime/
├── index.html            preloader: loads all files sequentially into the browser cache, then opens the studio
└── studio/
    ├── index.html        the editor: toolbox base categories, workspace, load/save/share
    ├── studio.js         registration API for blocks and lua helper functions (Studio.*)
    ├── base.js           blocks for the iCOMpadre hardware + common lua helper functions
    ├── radio.js          template for a new radio (not loaded)
    ├── radio/
    │   └── ic705.js      blocks for the ICOM IC-705
    ├── studio.css
    ├── filesaver.js      download of files (export)
    ├── img/              toolbar icons
    └── blockly/          minimal blockly 10 build: core, default blocks, english texts, lua generator
documentation/            user documentation (merged into the iCOMpadre userguide by the CI)
└── blocks/
    ├── base.md           documentation of the blocks in studio/base.js
    └── radio/
        └── ic705.md      documentation of the blocks in studio/radio/ic705.js
webserver.py              local development server
```

## How the studio starts

1. `runtime/index.html` loads every file of its `filesToLoad` list one after another. Loading them sequentially avoids too many concurrent requests on the SD card.
2. It then redirects to `studio/index.html`, which finds the files in the browser cache.
3. `studio/index.html` loads its scripts in this order:
   1. blockly, filesaver
   2. the inline `baseCategories` (Logic, Control, Math, ...)
   3. `studio.js`
   4. `base.js`, then `Studio.separator()`, then the radio files
   5. `Studio.buildToolbox(baseCategories)` and `Blockly.inject(...)`
4. The last workspace is loaded from `/icompadre.json` on the device.

The order of the radio `<script>` tags is the order of the categories in the toolbox.

## Interface to the device

The studio talks to iCOMpadre over plain HTTP:

| Request | Purpose |
| --- | --- |
| `GET /icompadre.json` | last saved workspace (404 if there is none) |
| `PUT /main.lua` | the generated lua program, executed by iCOMpadre in run mode |
| `PUT /icompadre.json` | the workspace, so it can be opened again |

The generated lua code may use the functions the firmware provides (`sendCommand`, `readResultOfCommand`, `wait`, `millis`, `setDigitalOutput`, ...).
They are described in the iCOMpadre documentation, chapter *operating modes / run*.

## The registration API

Block files never touch the toolbox directly. They register their blocks with `Studio` (see `runtime/studio/studio.js`):

```js
var ic705 = Studio.category("IC-705", "radio"); // new category in the toolbox, with the colour "radio"
ic705.action("ic705_set_af_level");             // also .event() .property() .helper()

var base = Studio.category("iCOMpadre");        // a category can be split into groups (sub categories)
var pins = base.group("Pins", "pins");          // ... each one with its own colour
pins.action("setdigitaloutput");

Studio.luaFunction("map", [                     // lua helper function ...
  "function map(x, in_min, in_max, out_min, out_max)",
  "  return out_min + (x - in_min)*(out_max - out_min)/(in_max - in_min)",
  "end"]);

Blockly.Lua['ic705_set_af_level'] = function(block) {
  Studio.use(['map', 'numberToBcd']);           // ... emitted into main.lua only if it is used
  ...
};
```

* A category (or group) shows its blocks sorted by *Events*, *Actions*, *Properties* and *Helpers*. Empty sections are hidden.
* `Studio.use()` throws if a function is not registered. Registering the same name twice logs a warning.
* Common helper functions are registered in `base.js`: `pretty`, `map`, `frequencyAsNumber`, `frequencyToBcd`, `numberToBcd`, `bcdToNumber`.

## Adding a radio

1. Copy `runtime/studio/radio.js` to `runtime/studio/radio/<radio>.js`, e.g. `radio/ic7300.js`.
2. Replace `myradio` / `My Radio` with the name of the radio and remove the example blocks you don't need.
3. Include the file in `runtime/studio/index.html` below the IC-705:
   ```html
   <script src="radio/ic7300.js"></script>
   ```
4. Add it to the `filesToLoad` list in `runtime/index.html`, otherwise it is not preloaded:
   ```js
   {"name":"radio functionality",    "url":"studio/radio/ic7300.js"},
   ```
5. Write the blocks (see conventions below). The CI-V reference guide of the radio lists the commands.
6. Document the blocks in `documentation/blocks/radio/<radio>.md`, named like the js file (see *Help* below).

## Block conventions

* **Naming:** block types start with the radio, e.g. `ic705_set_rf_gain`, `ic705_get_rf_gain`. Names have to be unique across all files.
* **Kinds:**
  * *action*: `previousStatement` / `nextStatement`, the generator returns a statement string ending with `\n`
  * *property*: `output` with a type (`"Number"`, `"String"`, `"Array"`), the generator returns `[code, Blockly.Lua.ORDER_ATOMIC]`
  * *event*: a statement input, the generator returns a lua function that the firmware calls
* **Definition:** use `jsonInit()` and set the tooltip only there.
* **CI-V:** put the command and the data format in a comment above the block, e.g. `// CI-V: 0x14 0x01 + level as 2 byte BCD`.
* **Values for the user:** blocks work with values people understand (percent, Hz, mode names). Converting them to what the radio expects happens in the generator.
* **Validation:** use `onchange` and `setWarningText()` to warn about invalid inputs.
* **Colour:** don't set a colour, see below.
* **Help:** don't set a `helpUrl`, see below.

`radio.js` contains a complete example for an action and a property block.

## Colours (convention over configuration)

The colour of a block says what it works with. The palette is defined once, in `STYLES` of `runtime/studio/studio.js`:

| Style | Colour | Used for |
| --- | --- | --- |
| `program` | sand | events, timing, program flow |
| `radio` | blue | everything that talks to the radio, i.e. all radio categories |
| `pins` | green | inputs and outputs of the iCOMpadre connector |
| `serial` | lavender | the serial interface |
| `helpers` | grey | conversions and other utilities |

Every block gets the style of the group (or category) it is registered in, so block definitions contain no colour at all.
The colours don't collide with the standard blockly categories. A new radio simply uses `Studio.category("<name>", "radio")`.

## Help (convention over configuration)

The documentation under `documentation/blocks/` mirrors the block files under `runtime/studio/`:

| Block file | Documentation | Help link of a block |
| --- | --- | --- |
| `studio/base.js` | `documentation/blocks/base.md` | `../userguide/studio/blocks/base/#<blocktype>` |
| `studio/radio/ic705.js` | `documentation/blocks/radio/ic705.md` | `../userguide/studio/blocks/radio/ic705/#<blocktype>` |

`Studio.category()` remembers which file registered the category, and `Studio.buildToolbox()` gives every block of it this link (*Help* in the context menu of the block).
To make the link jump to the right place, give the heading of the block its block type as id:

```markdown
## Set AF Level {#ic705_set_af_level}
```

Without the id the help still opens the right page, just at the top. A block that sets its own `helpUrl` keeps it.

## Local development

```sh
cd runtime
python ../webserver.py
```

Enter a port between 8000 and 8100 and open `http://localhost:<port>/`. The server serves `runtime/` and accepts `PUT` for `.lua` and `.json` files, like the device does.
Help links don't work locally, because the userguide only exists in the CI build.

To build the userguide with the studio documentation locally, do what the CI does: copy `documentation/` of this app to `documentation/studio/` of the iCOMpadre repository and run `mkdocs build` there.

### Checklist before committing a radio

* The studio loads without errors in the browser console.
* Every new block can be dragged onto the workspace.
* *Share* with `ctrl` pressed shows the generated lua code. Check it for every new block.
* The new file is in both `studio/index.html` and the preloader list.

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
    │   ├── icom.js       Icom.radio(): creates the blocks of a radio from a description of its CI-V commands
    │   └── ic705.js ...  descriptions of the IC-705, IC-7610, IC-7851, IC-9700, IC-718, IC-78, IC-2730 and IC-A120E
    ├── studio.css
    ├── filesaver.js      download of files (export)
    ├── img/              toolbar icons
    └── blockly/          blockly 13: core, default blocks, english texts, lua generator, media, multiline text plugin
documentation/            user documentation (merged into the iCOMpadre userguide by the CI)
└── blocks/
    ├── base.md           documentation of the blocks in studio/base.js
    └── radio/
        ├── ic705.md      documentation of the blocks in studio/radio/ic705.js
        └── ic7610.md ... documentation of the radios described with Icom.radio()
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
5. If the browser holds unsaved changes of an earlier session (`localStorage`, key `icompadre-studio.backup`), the studio offers to restore them.

Every file the studio loads (scripts, styles, images) has to be in the `filesToLoad` list of `runtime/index.html`, otherwise it is not preloaded.

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

Things to know when talking to a radio:

* `sendCommand(cmd, data)` only accepts tables of numbers. Data has to be the **second** table, never a table inside the command table.
* `sendCommand` does not wait for the answer. `readResultOfCommand(cmd)` returns the data of the **last** answer to `cmd`, or `nil` if there was none yet. Read blocks must handle `nil` (see `icomQuery` in `radio/icom.js`).
* Answers are matched by their command bytes, and the CI-V library decides how many bytes belong to the command: 2 bytes for `07 0E 13 14 15 16 19 1A 1B 1C 1E 21 27`, 4 bytes for `1A 05`, 1 byte for all others. A command like `23 00` therefore has to be sent as `sendCommand({0x23}, {0x00})`, otherwise its answer is never found.
* Values in the CI-V reference guides are BCD: `0x14` means *14*, not *20*. Levels "0000 ~ 0255" are 2 bytes BCD, most significant byte first. Frequencies are BCD with the least significant byte first.

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

Blockly.Lua.forBlock['ic705_set_af_level'] = function(block) {
  Studio.use(['map', 'numberToBcd']);           // ... emitted into main.lua only if it is used
  ...
};
```

* A category (or group) shows its blocks sorted by *Events*, *Actions*, *Properties* and *Helpers*. Empty sections are hidden.
* An optional second parameter is merged into the toolbox entry, e.g. to give inputs default values:
  `storage.action("storage_append_line", {"inputs": {"FILE": {"shadow": {"type": "text", "fields": {"TEXT": "log.txt"}}}}})`.
* `Studio.use()` throws if a function is not registered. Registering the same name twice logs a warning.
* A lua function that calls other registered functions lists them as third parameter, e.g. `Studio.luaFunction("icomPercent", [...], ["numberToBcd"])`. `Studio.use()` adds them as well.
* Common helper functions are registered in `base.js`: `pretty`, `map`, `frequencyAsNumber`, `frequencyToBcd`, `numberToBcd`, `bcdToNumber`.

## Adding a radio

Most Icom radios understand the same CI-V commands as the IC-705 and differ only in details (modes, attenuator steps,
meter scales, memory channels, ...). For them it is enough to **describe** the radio:

1. Copy `runtime/studio/radio/ic9700.js` (it uses almost every entry) to `runtime/studio/radio/<radio>.js`.
2. Go through the command table of the CI-V reference guide and adapt the entries: change the options and the page numbers,
   remove the entries of commands the radio doesn't have. `Icom.radio()` only creates blocks for the entries which are there.
   Every entry is explained in `runtime/studio/radio/icom.js`. The usual settings with more than on/off (`choices`) and the usual levels
   (`levels`) are given by their name, see `CHOICES` and `LEVELS` there.
3. Include the file in `runtime/studio/index.html` below `radio/icom.js` (the order of the files is the order in the toolbox), and add it to the `filesToLoad` list in `runtime/index.html`.
4. Write `documentation/blocks/radio/<radio>.md` (the existing ones show the structure: one section per block, with the CI-V command and the page)
   and add the radio to `documentation/blocks/index.md`.

A command which several radios have belongs into `Icom.radio()` as a new entry. Blocks which only make sense for one radio can also be written by hand:

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
  * *property*: `output` with a type (`"Number"`, `"String"`, `"Array"`), the generator returns `[code, lua.Order.ATOMIC]`
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
| `storage` | rose | files and remembered values on the SD card |
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

* The tests pass: `python tests/run_all.py` (see [tests/README.md](tests/README.md)). New blocks change the generated code,
  update it with `python tests/test_generated_code.py --update` and check the diff of `tests/expected_lua.json`.
* The studio loads without errors in the browser console.
* Every new block can be dragged onto the workspace.
* The *Lua* panel shows the generated lua code. Check it for every new block.
* The new file is in both `studio/index.html` and the preloader list.

## Updating blockly

The files in `runtime/studio/blockly/` come unchanged from the npm packages `blockly` and `@blockly/field-multilineinput` (same version), only the `//# sourceMappingURL` line is removed:

| File | From the package |
| --- | --- |
| `blockly_compressed.js`, `blocks_compressed.js`, `lua_compressed.js` | `blockly/` |
| `en.js` | `blockly/msg/en.js` |
| `sprites.svg`, `delete-icon.svg`, `foldout-icon.svg`, `resize-handle.svg`, `handclosed.cur`, `handdelete.cur` | `blockly/media/` (the sounds are not needed, the studio runs with `sounds: false`) |
| `field-multilineinput.js` | `@blockly/field-multilineinput/dist/index.js` (the `text_multiline` block, which is no longer part of blockly) |

After an update, compare the generated lua code of every block in the toolbox with the one of the previous version, and check that a sketch saved with the previous version still opens.

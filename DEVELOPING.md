# Developing iCOMpadre Studio

This guide is for people who want to extend the studio, especially by adding support for another radio.
The user facing documentation lives in [docs/](docs/).

## Design constraints

* The studio is served by iCOMpadre from its SD card, so it has to work **completely offline**: no CDNs, no web fonts, no online services.
* There is **no build step**. The files in `sdcard/` are exactly what ends up on the SD card. Plain JavaScript, loaded via `<script>` tags.
* The device is slow at serving files. Keep the number and size of files small.

## File structure

```text
sdcard/
├── index.html            preloader: loads all files sequentially into the browser cache, then opens the studio
└── studio/
    ├── index.html        the editor: toolbox base categories, workspace, load/save/share
    ├── studio.js         registration API for blocks and lua helper functions (Studio.*)
    ├── base.js           blocks for the iCOMpadre hardware + common lua helper functions
    ├── radio.js          template for a new radio (not loaded)
    ├── radio/
    │   ├── icom.js       Icom.radio(): creates the blocks of a radio from a description of its CI-V commands
    │   ├── radios.js     the list of the radios, in the order of the toolbox (the only place where they are listed)
    │   └── ic705.js ...  descriptions of the IC-705, IC-7300, IC-7300MK2, IC-7100, IC-7610, IC-7851, IC-9700, IC-718, IC-78, IC-2730 and IC-A120E
    ├── studio.css
    ├── filesaver.js      download of files (export)
    ├── img/              toolbar icons
    ├── msg/              the texts of the studio: en.js (master) and its translations (de.js, ...)
    └── blockly/          blockly 13: core, default blocks, texts (en.js, de.js), lua generator, media, multiline text plugin
docs/                     the user documentation (markdown). On the SD card it is built to /studio/docs/
├── .pages                order and titles of the pages in the menu (also in the sub folders)
├── index.md, editor.md, tutorial.md, blocks.md, about.md
├── tutorial/             the programs of the tutorial (.json to open in the studio) and their pictures
├── blockly/              the standard blockly categories (logic.md, control.md, ...)
├── base/                 documentation of the blocks in studio/base.js, one page per group (program.md, pins.md, ...)
├── radio/
│   ├── ic705.md          documentation of the blocks in studio/radio/ic705.js
│   └── ic7610.md ...     documentation of the radios described with Icom.radio()
└── img/                  pictures of the blocks
mkdocs.yml                for the preview of the documentation and its online version
webserver.py              local development server
```

## How the studio starts

1. `sdcard/index.html` loads every file of its `filesToLoad` list one after another. Loading them sequentially avoids too many concurrent requests on the SD card.
2. It then redirects to `studio/index.html`, which finds the files in the browser cache.
3. `studio/index.html` loads its scripts in this order:
   1. blockly, filesaver
   2. the inline `baseCategories` (Logic, Control, Math, ...)
   3. `studio.js`
   4. `base.js`, then `Studio.separator()`, then `radio/icom.js` and the radios of `radio/radios.js`
   5. `Studio.buildToolbox(baseCategories)` and `Blockly.inject(...)`
4. The last workspace is loaded from `/icompadre.json` on the device.
5. If the browser holds unsaved changes of an earlier session (`localStorage`, key `icompadre-studio.backup`), the studio offers to restore them.

Every file the studio loads (scripts, styles, images) has to be in the `filesToLoad` list of `sdcard/index.html`, otherwise it is not preloaded.
The radios are the exception: the preloader takes them from `radio/radios.js` as well.

The order in `radio/radios.js` is the order of the radio categories in the toolbox.

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

Block files never touch the toolbox directly. They register their blocks with `Studio` (see `sdcard/studio/studio.js`):

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

1. Copy `sdcard/studio/radio/ic9700.js` (it uses almost every entry) to `sdcard/studio/radio/<radio>.js`.
2. Go through the command table of the CI-V reference guide and adapt the entries: change the options and the page numbers,
   remove the entries of commands the radio doesn't have. `Icom.radio()` only creates blocks for the entries which are there.
   Every entry is explained in `sdcard/studio/radio/icom.js`. The usual settings with more than on/off (`choices`) and the usual levels
   (`levels`) are given by their name, see `CHOICES` and `LEVELS` there.
3. Add its name to `STUDIO_RADIOS` in `sdcard/studio/radio/radios.js`, at the place where it belongs in the toolbox.
   The studio and the preloader both take the radios from there.
4. Write `docs/radio/<radio>.md` (the existing ones show the structure: one section per block, with the CI-V command and the page)
   and add the radio to `docs/radio/.pages`, `docs/blocks.md` and the list of radios in `docs/base/radio.md`.

A command which several radios have belongs into `Icom.radio()` as a new entry. Blocks which only make sense for one radio can also be written by hand:

1. Copy `sdcard/studio/radio.js` to `sdcard/studio/radio/<radio>.js`, e.g. `radio/ic7700.js`.
2. Replace `myradio` / `My Radio` with the name of the radio and remove the example blocks you don't need.
3. Add its name to `STUDIO_RADIOS` in `sdcard/studio/radio/radios.js`:
   ```js
   "ic7700",
   ```
4. Write the blocks (see conventions below). The CI-V reference guide of the radio lists the commands.
5. Document the blocks in `docs/radio/<radio>.md`, named like the js file (see *Help* below), and add it to the lists like in step 4 above.

## Languages

The studio follows the language of the browser, or the one given with `?lang=de`. English is used when the language isn't offered.

* Every text shown to the user is in `sdcard/studio/msg/en.js` (`Blockly.Msg.ICP_<BLOCKTYPE>`, `..._TOOLTIP`) and is used as `Blockly.Msg.ICP_...` in the block files.
* A translation `msg/<language>.js` is loaded **after** `en.js` and overwrites the texts it has. A missing translation shows the english text, so new blocks only need english texts at first.
* Only texts are translated, never block types, field names or dropdown values. Sketches therefore open in every language.
* `tests/test_i18n.py` checks that translations have no unknown texts and keep the placeholders (`%1`, `%2`, ...), that every text exists and is used,
  and that the files in its `TRANSLATED_FILES` list contain no texts of their own. It also lists the texts which aren't translated yet.

The radios:

* The texts of the blocks which `Icom.radio()` creates are in `msg/en.js` as `ICOM_...`.
* The descriptions of the radios (`radio/ic705.js`, ...) stay english. A text of a description (e.g. the option `"Noise Blanker"`) is shown translated
  if `msg/<language>.js` has it as `ICOM_TERM_<the english text>`, e.g. `ICOM_TERM_Noise_Blanker` (upper and lower case as in the text). Otherwise it is shown as it is.
  `msg/en.js` has the same key with the english text. If the text in the description is changed, `test_i18n.py` reports the key as unused.
* The names which read blocks return to the program (e.g. `"USB"` from *Operating Mode*, `"FAST"` from *AGC*) are **never** translated:
  a program has to work the same in every language. `test_generated_code.py` checks that the iCOMpadre blocks generate the same lua code in every language.

So far `studio.js`, `base.js`, `radio/icom.js` and the names of the standard categories take their texts from `msg/`. The toolbar and the dialogs in `index.html` are still english.

A new language needs `msg/<language>.js`, `blockly/<language>.js` (from `blockly/msg/` of the npm package) and its code in the two `studioLanguage([...])` calls in `sdcard/index.html` and `sdcard/studio/index.html`.

## Block conventions

* **Naming:** block types start with the radio, e.g. `ic705_set_rf_gain`, `ic705_get_rf_gain`. Names have to be unique across all files.
* **Kinds:**
  * *action*: `previousStatement` / `nextStatement`, the generator returns a statement string ending with `\n`
  * *property*: `output` with a type (`"Number"`, `"String"`, `"Array"`), the generator returns `[code, lua.Order.ATOMIC]`
  * *event*: a statement input, the generator returns a lua function that the firmware calls
* **Definition:** use `jsonInit()` and set the tooltip only there.
* **Texts:** in files which are already translated, the texts come from `msg/en.js`, see *Languages* above.
* **CI-V:** put the command and the data format in a comment above the block, e.g. `// CI-V: 0x14 0x01 + level as 2 byte BCD`.
* **Values for the user:** blocks work with values people understand (percent, Hz, mode names). Converting them to what the radio expects happens in the generator.
* **Validation:** use `onchange` and `setWarningText()` to warn about invalid inputs.
* **Colour:** don't set a colour, see below.
* **Help:** don't set a `helpUrl`, see below.

`radio.js` contains a complete example for an action and a property block.

## Colours (convention over configuration)

The colour of a block says what it works with. The palette is defined once, in `STYLES` of `sdcard/studio/studio.js`:

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

The documentation under `docs/` mirrors the block files under `sdcard/studio/`.
On the SD card the built documentation is next to the studio (`/studio/docs/`), so the help links are relative:

| Block file | Documentation | Help link of a block |
| --- | --- | --- |
| `studio/radio/ic705.js` | `docs/radio/ic705.md` | `../docs/radio/ic705.html#<blocktype>` |
| `studio/base.js`, group `base.group("Pins", "pins", "pins")` | `docs/base/pins.md` | `../docs/base/pins.html#<blocktype>` |

They work on every copy of the SD card. On GitHub Pages the documentation is at `/studio/docs/`, so the demo links start with `../../studio/docs/`.
The studio served by githack (the repository itself, without the built documentation) links to GitHub Pages: `https://bytebang.github.io/iCOMpadre-studio/studio/docs/radio/ic705.html#<blocktype>`.
The pages are files (`use_directory_urls: false`), so the documentation also works without web server, e.g. opened from the SD card in a card reader.

`Studio.category()` remembers which file registered the category, and `Studio.buildToolbox()` gives every block of it this link (*Help* in the context menu of the block).
A group with a third parameter gets its own page in a folder named like the file; groups without it (e.g. the topics of the radios) share the page of their category.
To make the link jump to the right place, give the heading of the block its block type as id:

```markdown
## Set AF Level {#ic705_set_af_level}
```

Without the id the help still opens the right page, just at the top. A block that sets its own `helpUrl` keeps it.

## Local development

```sh
cd sdcard
python ../webserver.py
```

Enter a port between 8000 and 8100 and open `http://localhost:<port>/`. The server serves `sdcard/` and accepts `PUT` for `.lua` and `.json` files, like the device does.
### The documentation

The documentation is plain markdown, built with mkdocs (`pip install mkdocs mkdocs-awesome-pages-plugin pymdown-extensions`):

```sh
mkdocs serve                                  # preview while writing
mkdocs build --site-dir sdcard/docs # the help links of the local studio work
```

The second command puts the documentation where the studio looks for it, like `/studio/docs/` on the SD card (`sdcard/docs/` is not committed).
The order and the titles of the pages in the menu come from the `.pages` files (plugin `mkdocs-awesome-pages-plugin`); a new page has to be added there.

The documentation of iCOMpadre itself is separate, on the SD card in `/docs/`. Links to it are written with the path
of its markdown file on the SD card, e.g. `[Radios](/docs/radios.md)`: on the SD card the CI makes them relative links to the page. In a local build and online they lead nowhere.
On the SD card the CI of the iCOMpadre repository builds `docs/` with the settings of the iCOMpadre documentation, `mkdocs.yml` only gives the title.

`.github/workflows/docs.yml` builds the documentation on every push and pull request (strict: broken links fail the build) and publishes the studio
with its documentation on GitHub Pages: https://bytebang.github.io/iCOMpadre-studio/demo/ is the studio as online demo,
https://bytebang.github.io/iCOMpadre-studio/studio/docs/ its documentation. The project page links to both directly.
The studio notices that it runs online (`Studio.online`, on github.io and githack.com, or with `?online` in the address):
it starts empty and *Save* points to *Download*.

### Checklist before committing a radio

* The tests pass: `python tests/run_all.py` (see [tests/README.md](tests/README.md)). New blocks change the generated code,
  update it with `python tests/test_generated_code.py --update` and check the diff of `tests/expected_lua.json`.
* The studio loads without errors in the browser console.
* Every new block can be dragged onto the workspace.
* The *Lua* panel shows the generated lua code. Check it for every new block.
* The new radio is in `radio/radios.js`.

## Updating blockly

The files in `sdcard/studio/blockly/` come unchanged from the npm packages `blockly` and `@blockly/field-multilineinput` (same version), only the `//# sourceMappingURL` line is removed:

| File | From the package |
| --- | --- |
| `blockly_compressed.js`, `blocks_compressed.js`, `lua_compressed.js` | `blockly/` |
| `en.js`, `de.js` | `blockly/msg/en.js`, `blockly/msg/de.js` |
| `sprites.svg`, `delete-icon.svg`, `foldout-icon.svg`, `resize-handle.svg`, `handclosed.cur`, `handdelete.cur` | `blockly/media/` (the sounds are not needed, the studio runs with `sounds: false`) |
| `field-multilineinput.js` | `@blockly/field-multilineinput/dist/index.js` (the `text_multiline` block, which is no longer part of blockly) |

After an update, compare the generated lua code of every block in the toolbox with the one of the previous version, and check that a sketch saved with the previous version still opens.

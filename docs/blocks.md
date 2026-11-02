# Blocks

The blocks in the toolbox on the left side come in three groups:

| Group | Categories | Content |
| ----- | ---------- | ------- |
| **Blockly** | [Logic](blockly/logic.md), [Control](blockly/control.md), [Math](blockly/math.md), [Lists](blockly/lists.md), [Text](blockly/text.md), [Variables](blockly/variables.md), [Functions](blockly/functions.md) | the standard blocks, as you know them from the blockly ecosystem |
| **iCOMpadre** | [Program](base/program.md), [Radio](base/radio.md), [Pins](base/pins.md), [Serial](base/serial.md), [Storage](base/storage.md), [Helpers](base/helpers.md), [Tables](base/tables.md) | the blocks which make iCOMpadre special: events, the connection to the radio, pins, serial interface, SD card and Lua tables |
| **Radios** | [IC-705](radio/ic705.md), [IC-7300](radio/ic7300.md), [IC-7300MK2](radio/ic7300mk2.md), [IC-7100](radio/ic7100.md), [IC-7610](radio/ic7610.md), [IC-7851](radio/ic7851.md), [IC-9700](radio/ic9700.md), [IC-718](radio/ic718.md), [IC-78](radio/ic78.md), [IC-2730](radio/ic2730.md), [IC-A120E](radio/ica120e.md) | the settings of the ICOM radios |

The blocks of iCOMpadre and the radios have a *Help* entry in their context menu (right click), which leads to their description in this guide.

## Kinds of blocks

One can distinguish the blocks by their shape:

| Block Type         | Purpose |
| ------------------ | ------- |
| ![Event Block](eventblock.png) | _Event Blocks_ have no ditches or bulges and are triggered by the system as they occur. Their names always start with _On..._. There is no way to prevent this from happening.|
| ![Action Block](actionblock.png) | _Action blocks_ have a ditch on the upper side, and a bulge on the lower side. Sometimes they can also have selectors or further connectors for parameters. They can change settings on the radio. These settings are transmitted to the radio via the CI-V protocol in a fire and forget manner. Some settings may be overridden by the radio itself (in order to protect itself from whatever) or by other CI-V parties. |
| ![Property Block](propertyblock.png) | _Property blocks_ provide the current state of a setting on the radio (eg. the level of the AF-Gain) |

Internally the blocks consume and provide different data types - which makes the connection between two blocks sometimes impossible. Occasionally provided _Helper blocks_ can take care of this and provide some type-conversion.

## Colours

The colours of the standard blockly categories have no specific meaning. The colour of the iCOMpadre and radio blocks says what they work with:

| Colour | Blocks |
|--------|--------|
| <span style="color:#e0b65e">■</span> sand | [Program](base/program.md): when your program runs, timing |
| <span style="color:#5fa8c9">■</span> blue | [Radio](base/radio.md) and all radio categories: everything that talks to the radio |
| <span style="color:#9cc46b">■</span> green | [Pins](base/pins.md): inputs and outputs of the iCOMpadre connector |
| <span style="color:#b39ddb">■</span> lavender | [Serial](base/serial.md): the serial interface |
| <span style="color:#e39fb6">■</span> rose | [Storage](base/storage.md): remembering values, logs and files on the SD card |
| <span style="color:#a0a7ad">■</span> grey | [Helpers](base/helpers.md): conversions and comments |

## Reading values from the radio {#reading-values}

Blocks that read a value ask the radio and use its **last answer**. Right after the start there is no answer yet:
numbers are then 0, yes/no questions are *false* and texts are empty. Use them in [Periodically](base/program.md#periodically), where they are asked again and again.

## Lua code

Every block of iCOMpadre and the radios has a box *Lua code* in its description. It shows the code the block generates, which is useful if you
want to understand what happens on the CI-V bus, or if you write parts of your program in lua with [Execute Lua chunk](base/program.md#executeluachunk).
The [lua button](editor.md#action-buttons) of the editor shows the code of the whole program.

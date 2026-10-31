# Overview

The blocks of iCOMpadre-studio are grouped into the categories of the toolbox on the left side:

| Category                    | Content |
| --------------------------- | ------- |
| [Logic](logic.md)           | conditions: compare, and / or, not, true / false |
| [Control](control.md)       | if / else, loops over lists |
| [Math](math.md)             | numbers and calculations |
| [Lists](lists.md)           | lists of values, e.g. CI-V commands and responses |
| [Text](text.md)             | texts and printing to the serial interface |
| [Variables](variables.md)   | storing values |
| [Functions](functions.md)   | reusable groups of blocks |
| [iCOMpadre](base.md)        | events and the hardware of iCOMpadre: pins, serial interface, raw CI-V commands |
| [IC-705](radio/ic705.md)    | settings of the ICOM IC-705 |

The first seven categories are the standard blocks, as you know them from the blockly ecosystem. The last ones make iCOMpadre special.
The blocks of iCOMpadre and the radios have a *Help* entry in their context menu (right click), which leads to their description in this guide.

## Kinds of blocks

One can distinguish the blocks by their shape:

| Block Type         | Purpose |
| ------------------ | ------- |
| ![Event Block](eventblock.png) | _Event Blocks_ have no ditches or bulges and are triggered by the system as they occur. Their names always start with _On..._. There is no way to prevent this from happening.|
| ![Action Block](actionblock.png) | _Action blocks_ have a ditch on the upper side, and a bulge on the lower side. Sometimes they can also have selectors or further connectors for parameters. They can change settings on the radio. These settings are transmitted to the radio via the CI-V protocol in a fire and forget manner. Some settings may be overridden by the radio itself (in order to protect itself from whatever) or by other CI-V parties. |
| ![Property Block](propertyblock.png) | _Property blocks_ provide the current state of a setting on the radio (eg. the level of the AF-Gain) |

The color of the blocks has no specific meaning.

Internally the blocks consume and provide different data types - which makes the connection between two blocks sometimes impossible. Occasionally provided _Helper blocks_ can take care of this and provide some type-conversion.

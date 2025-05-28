# Overview

The blocks that iCOMpadre-studio provides can be subdivided in the following categories:

Most of the components are as you know them from the blockly ecosystem. Here comes a explaination of the blocks that make iCOMpadre special. One can distinguish the blocks by their shape:


| Block Type         | Purpose |
| ------------------ | ------- |
| ![Event Block](eventblock.png) | _Event Blocks_ have no ditches or bulges and are triggered by the system as they occur. Their names always start with _On..._. There is no way to prevent this from happening.|
| ![Action Block](actionblock.png) | _Action blocks_ have a ditch on the upper side, and a bulge un the lower side. Sometimes they can also have selectors or further connectors for parameters. They can change settings on the radio. These settings are transmitted to the radio via the CI-V protocol in a fire and forget manner. Some settings may be overridden by the radio itself (in order to protect itself from whatever) or by other CI-V parties. |
| ![Property Block](propertyblock.png) | _Property blocks_ provide the the current state of a setting on the radio (eg. the level of the AF-Gain) |


Beside these special kind of blocks, there are a lot of default blocks which have their roots in blockly. The color of the blocks has no specific meaning.

Internally the blocks consume and provide different data types - which makes the connection between two blocks sometimes impossible. Occasionally provided _Helper blocks_ can take care of this and provide some type-conversion.
# iCOMpadre-studio

This is a blockly based IDE for iCOMpadre.

## deployment

Download this repository as zip and extract it onto the SD card of iCOMpadre. Thats it.

If you just want to test it then you can test the [latest version of iCOMpadre Studio](https://rawcdn.githack.com/bytebang/iCOMpadre-studio/main/runtime/index.html) here online.

# Developing programs

The following sections describe our version of the editor, which comes bundled with iCOMpadre. You can always update the version by downloading a newer one onto a SD card and by inserting it into iCOMpadre.

However - our version can be called by visiting the webpage http://icompadre.local ... and it is a customized version of blockly (which is embedded into a nice webpage) which serves as a code editor. 

## Save

The _save_ button (or `ctrl+s`) stores the generated `main.lua` and the sketch on the SD card of iCOMpadre. The program runs the next time iCOMpadre is started in run mode.

## Download

The button _download_ downloads the current sketch to a file. The filename contains the date.

## Open

The button _open_ replaces the current sketch with a previously downloaded one. A file can also be dropped onto the button.

## Share

The button _share_ shows the sketch as text to share it with others, and imports sketches others have shared.

## Lua

The button _lua_ shows the generated lua code next to the workspace. It can be copied or downloaded as `main.lua` from there.


# Programming
 
You can code in blockly by adding blocks together. Most of the components are as you know them from the blockly ecosystem. Here comes a explaination of the blocks that make iCOMpadre special:

## Event blocks

Events are triggered by the system as they occur. There is no way to prevent this from happening.

### OnStartup

This block is executed once when de devices starts. Use it to initialize different things, in order to have a defined startpoint.

### Periodically

This block is executed periodically (as often as possible) if a radio is connected to iCOMpadre. If you do too much things in there, this could slow down the communication with the radio as well.

## Action blocks

Action blocks can change some settings on the radio. These settings are transmitted to the radio via the CI-V protocol in a fire and forget manner. 

Some settings may be overridden ba the radio itself (in order to protect itself from whatever)


### print

Prints the given text to the serial port (with 115200 Baud)

### Set PIN [A-H] to Value

Sets the selected PIN to High (=3.3V) or Low (=0V).

### Set PIN [A|B] to Voltage

Sets the voltage of the selected PIN to the given value. This works only for `PIN_A` and `PIN_B`. The output Voltage can be between 0.0. and 3.3V

## Property blocks

Property blocks are used to enter properties to the action blocks

### State of PIN [A-H]

Returns the state of one of the pins. The result is a boolean.

### Voltage of PIN [A|B]

Returns the voltage which is present on the selected pin.

### voltage

This is a convinience block, just to make programs look better and easier to understand. It translates a given number and a voltage postfix to its base unit [V]. 


# developing

How the studio is structured and how to add support for another radio is described in [DEVELOPING.md](DEVELOPING.md).

## datasheets and manuals

### Blockly

* Getting started https://developers.google.com/blockly/guides/get-started/web
* Block Factory: https://blockly-demo.appspot.com/static/demos/blockfactory/index.html

### File Saving

* File saving is done via https://github.com/eligrey/FileSaver.js/tree/master/src

### others

* HF Bandplan: https://oevsv.at/funkbetrieb/amateurfunkfrequenzen/hf-referat/

# license 

This software is dual licensed:

AGPLv3 for private use:
- You may use, copy, modify, and distribute this software under the terms of the Affero General Public License Version 3 (AGPLv3). The AGPLv3 requires that modified code, when provided over a network, be released under the AGPLv3 as well. For more information, see the [AGPLv3 license file](./LICENSE-AGPLv3.txt).

Proprietary license for commercial use:
- A separate proprietary license is available for commercial use of this software. The proprietary license grants you additional rights and restrictions beyond the provisions of the AGPLv3. Please contact us for information on commercial licensing.

If you use, copy, modify, or distribute this software, you must comply with the respective license terms. Please refer to the specific license files for more information.


# fine print

IMPORTANT: I DO NOT ASSUME ANY RESPONSIBILITY FOR YOUR USE OF THIS SOFTWARE, AND I MAKE NO REPRESENTATIONS ABOUT ITS SAFETY, APPROPRIATENESS, OR USE FOR A PARTICULAR PURPOSE. USE OF THIS SOFTWARE IS AS-IS.

Günther Hutter - OE6GUE

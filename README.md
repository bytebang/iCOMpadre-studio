# iCOMpadre-studio

This is a blockly based IDE for iCOMpadre.

## usage

Copy the web folder onto the SD card of iCOMpadre. Thats it.


## datasheets and manuals

### Blockly

* Getting started https://developers.google.com/blockly/guides/get-started/web
* Block Factory: https://blockly-demo.appspot.com/static/demos/blockfactory/index.html

### File Saving

* File saving is done via https://github.com/eligrey/FileSaver.js/tree/master/src

### others

* Debugging of the webapp can be done with the python builtin webserver `/web$ python -m SimpleHTTPServer 8000`
* HF Bandplan: https://oevsv.at/funkbetrieb/amateurfunkfrequenzen/hf-referat/



# Developing programs

The following sections describe our version of the editor, which comes bundled with iCOMpadre. You can always update the version by downloading a newer one onto a SD card and by inserting it into iCOMpadre.

However - our version can be called by visiting the webpage http://icompadre.local ... and it is a customized version of blockly (which is embedded into a nice webpage) which serves as a code editor. 

## Run

The _run_ button uploads the code of the current sketch to the hardware and runs the code.
If a user drops a lua file onto this button then this code will be uploaded an ran on the microcontroller.

## Export

The button _export_ downloads the current sketch to the file. The filename is dynamically created (appended with date). 
If the user presses the `ctrl` button during the press of this button then there will be the lua script exported.

## Open

The button _open_ lets the user upload a previously exported sketch.


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



# fine print

IMPORTANT: I DO NOT ASSUME ANY RESPONSIBILITY FOR YOUR USE OF THIS SOFTWARE, AND I MAKE NO REPRESENTATIONS ABOUT ITS SAFETY, APPROPRIATENESS, OR USE FOR A PARTICULAR PURPOSE. USE OF THIS SOFTWARE IS AS-IS.

Günther Hutter - OE6GUE
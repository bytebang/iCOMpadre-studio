// English texts of the studio. This is the master: every text shown to the user is defined here.
// The other languages (msg/<language>.js) are loaded after this file and only overwrite the texts they translate,
// a missing translation therefore shows the english text.
// tests/test_i18n.py checks that the other languages have no unknown keys and the same placeholders (%1, %2, ...).
//
// Only texts are translated, never block types, field names or dropdown values: sketches stay the same in every language.

// ----------------------------------------------- index.html: the standard blockly categories
Blockly.Msg.STUDIO_CATEGORY_LOGIC = "Logic";
Blockly.Msg.STUDIO_CATEGORY_CONTROL = "Control";
Blockly.Msg.STUDIO_CATEGORY_MATH = "Math";
Blockly.Msg.STUDIO_CATEGORY_LISTS = "Lists";
Blockly.Msg.STUDIO_CATEGORY_TEXT = "Text";
Blockly.Msg.STUDIO_CATEGORY_VARIABLES = "Variables";
Blockly.Msg.STUDIO_CATEGORY_FUNCTIONS = "Functions";

// ----------------------------------------------- studio.js
Blockly.Msg.STUDIO_EVENTS = "Events";
Blockly.Msg.STUDIO_ACTIONS = "Actions";
Blockly.Msg.STUDIO_PROPERTIES = "Properties";
Blockly.Msg.STUDIO_HELPERS = "Helpers";
Blockly.Msg.STUDIO_DUPLICATE_EVENT = "This block is %1 times in the program,\nbut only one of them is executed.\nPut all blocks into one of them\nand delete the others.";

// ----------------------------------------------- base.js: groups
Blockly.Msg.ICP_GROUP_PROGRAM = "Program";
Blockly.Msg.ICP_GROUP_RADIO = "Radio";
Blockly.Msg.ICP_GROUP_PINS = "Pins";
Blockly.Msg.ICP_GROUP_SERIAL = "Serial";
Blockly.Msg.ICP_GROUP_STORAGE = "Storage";
Blockly.Msg.ICP_GROUP_HELPERS = "Helpers";

// ----------------------------------------------- base.js: program
Blockly.Msg.ICP_ONSTARTUP = "OnStartup";
Blockly.Msg.ICP_ONSTARTUP_TOOLTIP = "This is executed during the startup of the device";
Blockly.Msg.ICP_PERIODICALLY = "Periodically";
Blockly.Msg.ICP_PERIODICALLY_TOOLTIP = "This is executed periodically if the radio is turned on. Otherwise the function is not called";
Blockly.Msg.ICP_ONRADIOCONNECTED = "OnRadioConnected";
Blockly.Msg.ICP_ONRADIOCONNECTED_TOOLTIP = "This is executed when the radio starts to answer: after the start of iCOMpadre or when the radio is switched on";
Blockly.Msg.ICP_ONRADIODISCONNECTED = "OnRadioDisconnected";
Blockly.Msg.ICP_ONRADIODISCONNECTED_TOOLTIP = "This is executed when the radio stops to answer, e.g. when it is switched off";
Blockly.Msg.ICP_ONCHANGEOF = "On change of";
Blockly.Msg.ICP_ONCHANGEOF_TOOLTIP = "Executes the block if the watchedValue changes";
Blockly.Msg.ICP_WAIT = "Wait %1 %2 ms";
Blockly.Msg.ICP_WAIT_TOOLTIP = "Waits for x milliseconds";
Blockly.Msg.ICP_EXECUTELUACHUNK = "execute Lua Chunk";
Blockly.Msg.ICP_EXECUTELUACHUNK_TOOLTIP = "Runs the given Lua Script";
Blockly.Msg.ICP_MILLIS = "milliseconds since start";
Blockly.Msg.ICP_MILLIS_TOOLTIP = "Returns the milliseconds since the device was started. Rolls over after ~49 days";

// ----------------------------------------------- base.js: radio
Blockly.Msg.ICP_CABLE = "cable (%1 baud)";
Blockly.Msg.ICP_CONNECT_RADIO = "Connect to %1 via %2";
Blockly.Msg.ICP_CONNECT_RADIO_TOOLTIP = "Selects the radio iCOMpadre talks to, with the default CI-V address of the radio. Put it into OnStartup. Without this block iCOMpadre talks to an IC-705 via Bluetooth";
Blockly.Msg.ICP_CONNECT_ADDRESS = "Connect to CI-V address %1 h via %2";
Blockly.Msg.ICP_CONNECT_ADDRESS_TOOLTIP = "Selects the radio iCOMpadre talks to by its CI-V address in hex (01 ~ DF), as it is set in the menu of the radio. Put it into OnStartup";
Blockly.Msg.ICP_SENDCOMMAND = "send command to radio";
Blockly.Msg.ICP_SENDCOMMAND_COMMAND = "command";
Blockly.Msg.ICP_SENDCOMMAND_DATA = "data";
Blockly.Msg.ICP_SENDCOMMAND_TOOLTIP = "Sends the given command to the radio";
Blockly.Msg.ICP_READDATA = "Read data from radio";
Blockly.Msg.ICP_READDATA_TOOLTIP = "Returns the plain resultarray of the given command";
Blockly.Msg.ICP_BCDASNUMBER = "BCD values as Number";
Blockly.Msg.ICP_BCDASNUMBER_TOOLTIP = "Converts bcd hex values to the corresponding number";
Blockly.Msg.ICP_PRETTYSTRING = "pretty";
Blockly.Msg.ICP_PRETTYSTRING_TOOLTIP = "Converts a list to a string with hex values";

// ----------------------------------------------- base.js: pins
Blockly.Msg.ICP_SETANALOGOUTPUT = "Set";
Blockly.Msg.ICP_SETANALOGOUTPUT_TO = "to Voltage";
Blockly.Msg.ICP_SETANALOGOUTPUT_TOOLTIP = "Sets the given pin to the selected value";
Blockly.Msg.ICP_SETDIGITALOUTPUT = "Set";
Blockly.Msg.ICP_SETDIGITALOUTPUT_TO = "to Value";
Blockly.Msg.ICP_SETDIGITALOUTPUT_TOOLTIP = "Sets the digital output to high (true) or low (false)";
Blockly.Msg.ICP_READANALOGINPUT = "Voltage of";
Blockly.Msg.ICP_READANALOGINPUT_TOOLTIP = "Reads the voltage at the given input in V";
Blockly.Msg.ICP_READDIGITALINPUT = "State of";
Blockly.Msg.ICP_READDIGITALINPUT_TOOLTIP = "Read the value of the given input";
Blockly.Msg.ICP_TOUCHVALUE = "Touch value of %1";
Blockly.Msg.ICP_TOUCHVALUE_TOOLTIP = "Reads the touch value of a pin";
Blockly.Msg.ICP_ISTOUCHED = "Is %1 %2 ?";
Blockly.Msg.ICP_ISTOUCHED_TOUCHED = "touched";
Blockly.Msg.ICP_ISTOUCHED_RELEASED = "released";
Blockly.Msg.ICP_ISTOUCHED_TOOLTIP = "Returns true if a pin has been touched";
Blockly.Msg.ICP_VOLTAGEVALUE_TOOLTIP = "Voltage representation";

// ----------------------------------------------- base.js: serial
Blockly.Msg.ICP_ONSERIALLINE = "OnSerialLine";
Blockly.Msg.ICP_ONSERIALLINE_TOOLTIP = "This is triggered when a user enters a command on the serial interface. The content of the line is in the variable line";
Blockly.Msg.ICP_ONSERIALBYTE = "OnSerialByte";
Blockly.Msg.ICP_ONSERIALBYTE_TOOLTIP = "This is triggered each time a byte arrives on the serial interface. The value of the byte is in the variable byte as number";
Blockly.Msg.ICP_CONFIGSERIAL = "Set serial speed to %1,8,N,1";
Blockly.Msg.ICP_CONFIGSERIAL_TOOLTIP = "Sets the speed of the serial port";

// ----------------------------------------------- base.js: storage
Blockly.Msg.ICP_STORAGE_REMEMBER = "Remember %1 as %2";
Blockly.Msg.ICP_STORAGE_REMEMBER_TOOLTIP = "Remembers a value (number, text, true/false or list) under a name. It is kept on the SD card, also when iCOMpadre is switched off";
Blockly.Msg.ICP_STORAGE_FORGET = "Forget %1";
Blockly.Msg.ICP_STORAGE_FORGET_TOOLTIP = "Forgets the value remembered under the name";
Blockly.Msg.ICP_STORAGE_APPEND_LINE = "Append line %1 to file %2";
Blockly.Msg.ICP_STORAGE_APPEND_LINE_TOOLTIP = "Appends the text as a new line to the end of the file. The file is created if it does not exist";
Blockly.Msg.ICP_STORAGE_APPEND_CSV = "Append values %1 to CSV file %2";
Blockly.Msg.ICP_STORAGE_APPEND_CSV_TOOLTIP = "Appends the values of the list as a new line to a CSV file, which can be opened in a spreadsheet";
Blockly.Msg.ICP_STORAGE_WRITE_FILE = "Write text %1 to file %2";
Blockly.Msg.ICP_STORAGE_WRITE_FILE_TOOLTIP = "Writes the text to the file. The old content of the file is replaced";
Blockly.Msg.ICP_STORAGE_DELETE_FILE = "Delete file %1";
Blockly.Msg.ICP_STORAGE_DELETE_FILE_TOOLTIP = "Deletes the file";
Blockly.Msg.ICP_STORAGE_RECALL = "Recall %1 or else %2";
Blockly.Msg.ICP_STORAGE_RECALL_TOOLTIP = "Returns the value remembered under the name. If nothing has been remembered yet, the value after 'or else' is returned";
Blockly.Msg.ICP_STORAGE_FILE_LINES = "Lines of file %1";
Blockly.Msg.ICP_STORAGE_FILE_LINES_TOOLTIP = "Returns the lines of the file as a list. The list is empty if the file does not exist";
Blockly.Msg.ICP_STORAGE_READ_FILE = "Text of file %1";
Blockly.Msg.ICP_STORAGE_READ_FILE_TOOLTIP = "Returns the content of the file as text. The text is empty if the file does not exist";
Blockly.Msg.ICP_STORAGE_FILE_EXISTS = "File %1 exists?";
Blockly.Msg.ICP_STORAGE_FILE_EXISTS_TOOLTIP = "True if the file exists";

// ----------------------------------------------- base.js: helpers
Blockly.Msg.ICP_COMMENT = "Comment: %1";
Blockly.Msg.ICP_COMMENT_TOOLTIP = "Does nothing, is just for commenting";
Blockly.Msg.ICP_MAPNUMBER = "map";
Blockly.Msg.ICP_MAPNUMBER_FROM = "from range of";
Blockly.Msg.ICP_MAPNUMBER_TO = "to range from";
Blockly.Msg.ICP_MAPNUMBER_TOOLTIP = "Maps a number from one range into another (by linear intra/extrapolation).";
Blockly.Msg.ICP_ASCHAR = "char of";
Blockly.Msg.ICP_ASCHAR_TOOLTIP = "Converts the number to a character";
Blockly.Msg.ICP_ASBYTE = "byte of character %1";
Blockly.Msg.ICP_ASBYTE_TOOLTIP = "Converts the first character of the given string to a numeric byte value";
Blockly.Msg.ICP_RINGBUFFER_ADD = "add %1 to ring buffer %2 keep last %3";
Blockly.Msg.ICP_RINGBUFFER_ADD_TOOLTIP = "Adds a value to a list and removes the oldest values, so that the list always holds the last values";
Blockly.Msg.ICP_RINGBUFFER_CLEAR = "clear ring buffer %1";
Blockly.Msg.ICP_RINGBUFFER_CLEAR_TOOLTIP = "Removes all values from the ring buffer";
Blockly.Msg.ICP_RINGBUFFER_GET = "%1 of ring buffer %2";
Blockly.Msg.ICP_RINGBUFFER_GET_TOOLTIP = "Calculates a value from the numbers in the ring buffer. It is 0 as long as the buffer is empty";
Blockly.Msg.ICP_RINGBUFFER_AVERAGE = "average";
Blockly.Msg.ICP_RINGBUFFER_MIN = "minimum";
Blockly.Msg.ICP_RINGBUFFER_MAX = "maximum";
Blockly.Msg.ICP_RINGBUFFER_RANGE = "range (max - min)";
Blockly.Msg.ICP_RINGBUFFER_MEDIAN = "median";
Blockly.Msg.ICP_RINGBUFFER_STDDEV = "standard deviation";
Blockly.Msg.ICP_RINGBUFFER_SUM = "sum";
Blockly.Msg.ICP_RINGBUFFER_NEWEST = "newest value";
Blockly.Msg.ICP_RINGBUFFER_OLDEST = "oldest value";
Blockly.Msg.ICP_RINGBUFFER_CHANGE = "change (newest - oldest)";
Blockly.Msg.ICP_RINGBUFFER_COUNT = "number of values";

// ----------------------------------------------- radio/icom.js: groups, words used everywhere
Blockly.Msg.ICOM_GROUP_FREQUENCY_MODE = "Frequency & Mode";
Blockly.Msg.ICOM_GROUP_RECEIVER = "Receiver";
Blockly.Msg.ICOM_GROUP_TRANSMIT = "Transmit";
Blockly.Msg.ICOM_GROUP_METERS = "Meters";
Blockly.Msg.ICOM_GROUP_CW_VOICE = "CW & Voice";
Blockly.Msg.ICOM_GROUP_GPS_TIME = "GPS & Time";
Blockly.Msg.ICOM_GROUP_SETTINGS = "Settings";
Blockly.Msg.ICOM_ON = "on";
Blockly.Msg.ICOM_OFF = "off";
Blockly.Msg.ICOM_OR = "{list} or {last}";

// ----------------------------------------------- radio/icom.js: settings of command 16 with more than on/off (CHOICES)
Blockly.Msg.ICOM_DSP_FILTER_TYPE = "DSP Filter Type";
Blockly.Msg.ICOM_DSP_FILTER_TYPE_TOOLTIP = "Sets the shape of the DSP IF filter in the operating band";
Blockly.Msg.ICOM_NOTCH_WIDTH = "Manual Notch Width";
Blockly.Msg.ICOM_NOTCH_WIDTH_TOOLTIP = "Sets the width of the manual notch filter";
Blockly.Msg.ICOM_DIGITAL_SQUELCH = "Digital Squelch";
Blockly.Msg.ICOM_DIGITAL_SQUELCH_TOOLTIP = "Sets the digital call sign squelch (DSQL) or the digital code squelch (CSQL). DV mode only";
Blockly.Msg.ICOM_TONE_FUNCTION = "Tone Function";
Blockly.Msg.ICOM_TONE_FUNCTION_TOOLTIP = "Selects the repeater tone, tone squelch or DTCS function (FM mode)";
Blockly.Msg.ICOM_SSB_TX_BANDWIDTH = "SSB TX Bandwidth";
Blockly.Msg.ICOM_SSB_TX_BANDWIDTH_TOOLTIP = "Selects the SSB transmit bandwidth";
Blockly.Msg.ICOM_BREAK_IN = "Break-In";
Blockly.Msg.ICOM_BREAK_IN_TOOLTIP = "Sets the CW break-in function: off, semi or full break-in";
Blockly.Msg.ICOM_GPS_TX_MODE = "GPS TX Mode";
Blockly.Msg.ICOM_GPS_TX_MODE_TOOLTIP = "Selects which position data is transmitted in DV mode";

// ----------------------------------------------- radio/icom.js: levels of command 14 in the block Set Level (LEVELS)
Blockly.Msg.ICOM_LEVEL_NR = "NR level";
Blockly.Msg.ICOM_LEVEL_NB = "NB level";
Blockly.Msg.ICOM_LEVEL_PBT1 = "inner PBT (PBT1)";
Blockly.Msg.ICOM_LEVEL_PBT2 = "outer PBT (PBT2)";
Blockly.Msg.ICOM_LEVEL_NOTCH = "manual notch position";
Blockly.Msg.ICOM_LEVEL_MONITOR = "monitor level";
Blockly.Msg.ICOM_LEVEL_VOX = "VOX gain";
Blockly.Msg.ICOM_LEVEL_ANTIVOX = "anti-VOX gain";

// ----------------------------------------------- radio/icom.js: frequency & mode
Blockly.Msg.ICOM_SET_FREQUENCY = "Set Frequency to %1 %2";
Blockly.Msg.ICOM_SET_FREQUENCY_TOOLTIP = "Sets the frequency of the radio";
Blockly.Msg.ICOM_SET_OPERATING_MODE = "Set Operating Mode to %1";
Blockly.Msg.ICOM_SET_OPERATING_MODE_TOOLTIP = "Sets the operating mode of the radio";
Blockly.Msg.ICOM_SET_DATA_MODE = "Data Mode %1";
Blockly.Msg.ICOM_SET_DATA_MODE_TOOLTIP = "Switches the data mode (e.g. USB-D for digital modes like FT8) on or off";
Blockly.Msg.ICOM_SET_TUNING_STEP = "Set Tuning Step to %1";
Blockly.Msg.ICOM_SET_TUNING_STEP_TOOLTIP = "Sets the tuning step of the radio";
Blockly.Msg.ICOM_SELECT_VFO = "Select {vfo}";
Blockly.Msg.ICOM_SELECT_VFO_TOOLTIP = "Selects {vfo}";
Blockly.Msg.ICOM_SELECT = "Select %1";
Blockly.Msg.ICOM_SELECT_TOOLTIP = "Selects {options}";
Blockly.Msg.ICOM_EQUALIZE = "Equalize {what}";
Blockly.Msg.ICOM_EQUALIZE_TOOLTIP = "Copies the frequency and mode of the selected one to the other one ({what})";
Blockly.Msg.ICOM_EXCHANGE = "Exchange {what}";
Blockly.Msg.ICOM_EXCHANGE_TOOLTIP = "Exchanges the frequency and mode of the {what}";
Blockly.Msg.ICOM_SET_DUALWATCH = "Dualwatch %1";
Blockly.Msg.ICOM_SET_DUALWATCH_TOOLTIP = "Switches the dualwatch (receiving on the main and the sub band) on or off";
Blockly.Msg.ICOM_SET_SPLIT = "Set %1";
Blockly.Msg.ICOM_SELECT_MEMORY = "Select Memory Channel %1";
Blockly.Msg.ICOM_SELECT_MEMORY_TOOLTIP = "Switches to the memory mode and selects the memory channel ({min} ~ {max})";
Blockly.Msg.ICOM_MEMORY_RANGE = "The memory channel must be between {min} and {max}";
Blockly.Msg.ICOM_SET_RIT = "RIT %1";
Blockly.Msg.ICOM_SET_RIT_TOOLTIP = "Switches the RIT (receive incremental tuning) on or off";
Blockly.Msg.ICOM_SET_RIT_OFFSET = "Set RIT offset to %1 Hz";
Blockly.Msg.ICOM_SET_RIT_OFFSET_TOOLTIP = "Sets the RIT offset (-9999 ~ +9999 Hz)";
Blockly.Msg.ICOM_RIT_OFFSET_RANGE = "The RIT offset must be between -9999 and +9999 Hz";
Blockly.Msg.ICOM_SCAN = "Scan %1";
Blockly.Msg.ICOM_SCAN_TOOLTIP = "Starts a scan of the selected type, or stops it";
Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY = "operating frequency in %1";
Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY_TOOLTIP = "Reads the current frequency of the radio";
Blockly.Msg.ICOM_GET_OPERATING_MODE = "Operating Mode";
Blockly.Msg.ICOM_GET_OPERATING_MODE_TOOLTIP = "Reads the current operating mode of the radio ({options})";
Blockly.Msg.ICOM_IS_DATA_MODE = "Is Data Mode on?";
Blockly.Msg.ICOM_IS_DATA_MODE_TOOLTIP = "True if the data mode (e.g. USB-D) is on";
Blockly.Msg.ICOM_IS_DUALWATCH = "Is Dualwatch on?";
Blockly.Msg.ICOM_IS_DUALWATCH_TOOLTIP = "True if the dualwatch is on";
Blockly.Msg.ICOM_IS_SPLIT = "Is Split on?";
Blockly.Msg.ICOM_IS_SPLIT_TOOLTIP = "True if the split function is on";

// ----------------------------------------------- radio/icom.js: levels 0 ~ 100 % (level), settings with a dropdown (setting) and scaled levels (scaled)
Blockly.Msg.ICOM_SET_LEVEL = "Set {label} to %1 %%";
Blockly.Msg.ICOM_SET_LEVEL_TOOLTIP = "Sets the {text} (in %)";
Blockly.Msg.ICOM_GET_LEVEL_TOOLTIP = "Reads the {text} (in %)";
Blockly.Msg.ICOM_LEVEL_RANGE = "{label} must be between 0 and 100%";
Blockly.Msg.ICOM_SET_SETTING = "Set {label} to %1";
Blockly.Msg.ICOM_SET_SETTING_TOOLTIP = "Sets the {text}: {options}";
Blockly.Msg.ICOM_GET_SETTING_TOOLTIP = "Reads the {text}: {options}";
Blockly.Msg.ICOM_IS_SETTING_ON = "Is {label} on?";
Blockly.Msg.ICOM_IS_SETTING_ON_TOOLTIP = "True if {label} is on";
Blockly.Msg.ICOM_SET_SCALED = "Set {label} to %1{unit}";
Blockly.Msg.ICOM_SET_SCALED_TOOLTIP = "Sets the {text} ({min} ~ {max}{unit})";
Blockly.Msg.ICOM_GET_SCALED_TOOLTIP = "Reads the {text} ({min} ~ {max})";
Blockly.Msg.ICOM_GET_SCALED_UNIT_TOOLTIP = "Reads the {text} (in {unitName})";
Blockly.Msg.ICOM_SCALED_RANGE = "{label} must be between {min} and {max}{unit}";
Blockly.Msg.ICOM_AF_LEVEL = "AF Level";
Blockly.Msg.ICOM_AF_LEVEL_TEXT = "AF output level (volume)";
Blockly.Msg.ICOM_RF_GAIN = "RF Gain";
Blockly.Msg.ICOM_RF_GAIN_TEXT = "RF gain";
Blockly.Msg.ICOM_SQUELCH_LEVEL = "Squelch Level";
Blockly.Msg.ICOM_SQUELCH_LEVEL_TEXT = "squelch level";
Blockly.Msg.ICOM_RF_POWER = "RF Power";
Blockly.Msg.ICOM_RF_POWER_TEXT = "RF power in % of the maximum";
Blockly.Msg.ICOM_MIC_GAIN = "Mic Gain";
Blockly.Msg.ICOM_MIC_GAIN_TEXT = "mic gain";
Blockly.Msg.ICOM_LCD_BRIGHTNESS = "LCD Brightness";
Blockly.Msg.ICOM_LCD_BRIGHTNESS_TEXT = "LCD brightness";
Blockly.Msg.ICOM_PREAMP = "Preamp";
Blockly.Msg.ICOM_PREAMP_TEXT = "preamplifier";
Blockly.Msg.ICOM_ATTENUATOR = "Attenuator";
Blockly.Msg.ICOM_ATTENUATOR_TEXT = "attenuator";
Blockly.Msg.ICOM_AGC = "AGC";
Blockly.Msg.ICOM_AGC_TEXT = "AGC time constant";
Blockly.Msg.ICOM_COMP_LEVEL = "Compressor Level";
Blockly.Msg.ICOM_COMP_LEVEL_TEXT = "level of the speech compressor";
Blockly.Msg.ICOM_CW_PITCH = "CW Pitch";
Blockly.Msg.ICOM_CW_PITCH_TEXT = "CW pitch";
Blockly.Msg.ICOM_BREAK_IN_DELAY = "Break-In Delay";
Blockly.Msg.ICOM_BREAK_IN_DELAY_TEXT = "delay of the semi break-in";
Blockly.Msg.ICOM_DOTS = "dots";

// ----------------------------------------------- radio/icom.js: receiver
Blockly.Msg.ICOM_IS_SQUELCH_OPEN = "Is Squelch open?";
Blockly.Msg.ICOM_IS_SQUELCH_OPEN_TOOLTIP = "True if the squelch is open, i.e. a signal is received";
Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN = "Is Tone Squelch open?";
Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN_TOOLTIP = "True if the tone squelch (or DTCS, DSQL, CSQL) is open, i.e. a matching signal is received";

// ----------------------------------------------- radio/icom.js: transmit
Blockly.Msg.ICOM_SET_TRANSMIT = "Transmit %1";
Blockly.Msg.ICOM_TRANSMIT_ON = "on (TX)";
Blockly.Msg.ICOM_TRANSMIT_OFF = "off (RX)";
Blockly.Msg.ICOM_SET_TRANSMIT_TOOLTIP = "Switches the transmitter on (like pressing PTT) or back to receive. Make sure your program switches it off again!";
Blockly.Msg.ICOM_SET_RF_POWER_STEP = "Set RF Power to %1";
Blockly.Msg.ICOM_SET_RF_POWER_STEP_TOOLTIP = "Sets the RF power: {options}";
Blockly.Msg.ICOM_GET_RF_POWER_STEP_TOOLTIP = "Reads the RF power setting: {options}";
Blockly.Msg.ICOM_SET_TONE = "Set Repeater Tone to %1 Hz";
Blockly.Msg.ICOM_SET_TONE_TOOLTIP = "Sets the frequency of the repeater tone (CTCSS), e.g. 88.5 Hz";
Blockly.Msg.ICOM_TONE_RANGE = "The repeater tone must be between 67.0 and 254.1 Hz";
Blockly.Msg.ICOM_IS_TRANSMITTING = "Is Transmitting?";
Blockly.Msg.ICOM_IS_TRANSMITTING_TOOLTIP = "True while the radio transmits";
Blockly.Msg.ICOM_SET_TSQL = "Set Tone Squelch to %1 Hz";
Blockly.Msg.ICOM_SET_TSQL_TOOLTIP = "Sets the frequency of the tone squelch (CTCSS), e.g. 88.5 Hz";
Blockly.Msg.ICOM_TSQL_RANGE = "The tone squelch frequency must be between 67.0 and 254.1 Hz";
Blockly.Msg.ICOM_SET_DTCS = "Set DTCS Code to %1 polarity %2";
Blockly.Msg.ICOM_DTCS_NORMAL = "normal";
Blockly.Msg.ICOM_DTCS_TX_REVERSE = "TX reverse";
Blockly.Msg.ICOM_DTCS_RX_REVERSE = "RX reverse";
Blockly.Msg.ICOM_DTCS_BOTH_REVERSE = "TX and RX reverse";
Blockly.Msg.ICOM_SET_DTCS_TOOLTIP = "Sets the DTCS code (e.g. 23 for code 023, digits 0 ~ 7) and its polarity";
Blockly.Msg.ICOM_DTCS_INVALID = "A DTCS code has up to 3 digits from 0 to 7, e.g. 23";
Blockly.Msg.ICOM_GET_DTCS = "DTCS Code";
Blockly.Msg.ICOM_GET_DTCS_TOOLTIP = "Reads the DTCS code, e.g. 23 for code 023";
Blockly.Msg.ICOM_SET_CSQL = "Set Digital Code Squelch to %1";
Blockly.Msg.ICOM_SET_CSQL_TOOLTIP = "Sets the code of the digital code squelch (CSQL) in DV mode (0 ~ 99)";
Blockly.Msg.ICOM_CSQL_RANGE = "The code must be between 0 and 99";

// ----------------------------------------------- radio/icom.js: meters
Blockly.Msg.ICOM_S_METER = "S-Meter in %1";
Blockly.Msg.ICOM_S_UNITS = "S-units";
Blockly.Msg.ICOM_DB_OVER_S9 = "dB over S9";
Blockly.Msg.ICOM_S_METER_DB_TOOLTIP = "Reads the S-meter: in S-units (0 ~ 9), or in dB over S9 (negative below S9, 6 dB per S-unit)";
Blockly.Msg.ICOM_S_METER_TOOLTIP = "Reads the S-meter in S-units (0 ~ 9)";
Blockly.Msg.ICOM_SWR = "SWR";
Blockly.Msg.ICOM_SWR_TOOLTIP = "Reads the SWR while transmitting, e.g. 1.5";
Blockly.Msg.ICOM_POWER_OUTPUT = "Power Output";
Blockly.Msg.ICOM_POWER_OUTPUT_W_TOOLTIP = "Reads the output power while transmitting (in W)";
Blockly.Msg.ICOM_POWER_OUTPUT_PERCENT_TOOLTIP = "Reads the output power meter while transmitting (in % of the maximum)";
Blockly.Msg.ICOM_ALC = "ALC";
Blockly.Msg.ICOM_ALC_TOOLTIP = "Reads the ALC meter while transmitting (in %, 100 = end of the ALC zone)";
Blockly.Msg.ICOM_SUPPLY_VOLTAGE = "Supply Voltage";
Blockly.Msg.ICOM_SUPPLY_VOLTAGE_TOOLTIP = "Reads the supply voltage of the final amplifier (in V)";
Blockly.Msg.ICOM_SUPPLY_CURRENT = "Supply Current";
Blockly.Msg.ICOM_SUPPLY_CURRENT_TOOLTIP = "Reads the current drawn by the final amplifier (in A)";
Blockly.Msg.ICOM_IS_ON_BATTERY = "Is on Battery?";
Blockly.Msg.ICOM_IS_ON_BATTERY_TOOLTIP = "True if the radio is powered by its battery pack, false with an external power supply";
Blockly.Msg.ICOM_IS_OVERFLOW = "Is Overflow?";
Blockly.Msg.ICOM_IS_OVERFLOW_TOOLTIP = "True if the OVF indicator is on, i.e. the receiver is overloaded by a strong signal";
Blockly.Msg.ICOM_COMPRESSION = "Compression";
Blockly.Msg.ICOM_COMPRESSION_TOOLTIP = "Reads the COMP meter while transmitting with the speech compressor (in dB)";

// ----------------------------------------------- radio/icom.js: CW & voice
Blockly.Msg.ICOM_SEND_CW = "Send CW %1";
Blockly.Msg.ICOM_SEND_CW_TOOLTIP = "Sends the text (up to 30 characters) as CW. The radio has to be in CW mode with break-in on";
Blockly.Msg.ICOM_SET_KEYING_SPEED = "Set CW Speed to %1 WPM";
Blockly.Msg.ICOM_SET_KEYING_SPEED_TOOLTIP = "Sets the keying speed of the electronic keyer (6 ~ 48 WPM)";
Blockly.Msg.ICOM_KEYING_SPEED_RANGE = "The CW speed must be between 6 and 48 WPM";
Blockly.Msg.ICOM_PLAY_VOICE_MEMORY = "Transmit Voice Memory %1";
Blockly.Msg.ICOM_STOP = "stop";
Blockly.Msg.ICOM_PLAY_VOICE_MEMORY_TOOLTIP = "Transmits a recorded voice memory (e.g. a CQ call), or stops it";
Blockly.Msg.ICOM_ANNOUNCE = "Announce %1";
Blockly.Msg.ICOM_ANNOUNCE_ALL = "frequency, S-meter and mode";
Blockly.Msg.ICOM_ANNOUNCE_FREQUENCY = "frequency and S-meter";
Blockly.Msg.ICOM_ANNOUNCE_MODE = "mode";
Blockly.Msg.ICOM_ANNOUNCE_TOOLTIP = "The radio speaks the selected information with its voice synthesizer";
Blockly.Msg.ICOM_GET_KEYING_SPEED = "CW Speed";
Blockly.Msg.ICOM_GET_KEYING_SPEED_TOOLTIP = "Reads the keying speed of the electronic keyer (in WPM)";

// ----------------------------------------------- radio/icom.js: GPS & time
Blockly.Msg.ICOM_POSITION = "Position";
Blockly.Msg.ICOM_GET_POSITION = "{label} %1";
Blockly.Msg.ICOM_GET_POSITION_TOOLTIP = "{text}. Latitude and longitude in degrees (north and east positive)";
Blockly.Msg.ICOM_LATITUDE = "latitude";
Blockly.Msg.ICOM_LONGITUDE = "longitude";
Blockly.Msg.ICOM_ALTITUDE = "altitude (m)";
Blockly.Msg.ICOM_COURSE = "course (°)";
Blockly.Msg.ICOM_SPEED = "speed (km/h)";
Blockly.Msg.ICOM_GET_GPS_TIME = "GPS Time (UTC) %1";
Blockly.Msg.ICOM_AS_TEXT = "as text";
Blockly.Msg.ICOM_UNIX_TIME = "unix time";
Blockly.Msg.ICOM_YEAR = "year";
Blockly.Msg.ICOM_MONTH = "month";
Blockly.Msg.ICOM_DAY = "day";
Blockly.Msg.ICOM_HOUR = "hour";
Blockly.Msg.ICOM_MINUTE = "minute";
Blockly.Msg.ICOM_SECOND = "second";
Blockly.Msg.ICOM_GET_GPS_TIME_TOOLTIP = "Reads the date and time (UTC) of the GPS. Unix time are the seconds since 1970-01-01";
Blockly.Msg.ICOM_GET_CLOCK = "Radio Clock %1";
Blockly.Msg.ICOM_TIME_AS_TEXT = "time as text";
Blockly.Msg.ICOM_DATE_AS_TEXT = "date as text";
Blockly.Msg.ICOM_GET_CLOCK_TOOLTIP = "Reads the date and time of the clock of the radio (local time)";
Blockly.Msg.ICOM_LOCATOR = "Locator of latitude %1 longitude %2";
Blockly.Msg.ICOM_LOCATOR_TOOLTIP = "Calculates the Maidenhead locator (6 characters, e.g. JN77rb) of a position";

// ----------------------------------------------- radio/icom.js: settings
Blockly.Msg.ICOM_SWITCH_FUNCTION = "Switch %1 %2";
Blockly.Msg.ICOM_SWITCH_FUNCTION_TOOLTIP = "Switches a function of the radio on or off";
Blockly.Msg.ICOM_SET_POWER = "Switch Radio %1";
Blockly.Msg.ICOM_SET_POWER_TOOLTIP = "Switches the radio off or on. Switching on only works if the radio is in standby";
Blockly.Msg.ICOM_IS_FUNCTION_ON = "Is %1 on?";
Blockly.Msg.ICOM_IS_FUNCTION_ON_TOOLTIP = "True if the function of the radio is switched on";
Blockly.Msg.ICOM_SET_LEVEL_OF = "Set %1 to %2 %%";
Blockly.Msg.ICOM_SET_LEVEL_OF_TOOLTIP = "Sets a level in %. For a PBT or a notch position 50 % is the center";
Blockly.Msg.ICOM_LEVEL_OF_RANGE = "The level must be between 0 and 100%";
Blockly.Msg.ICOM_GET_LEVEL_OF_TOOLTIP = "Reads a level (in %)";
Blockly.Msg.ICOM_SET_MENU = "Set Menu Setting %1 to %2 %3";
Blockly.Msg.ICOM_MENU_1_BYTE = "as 00 ~ 99";
Blockly.Msg.ICOM_MENU_2_BYTES = "as 0000 ~ 9999";
Blockly.Msg.ICOM_SET_MENU_TOOLTIP = "Changes a setting of the menu (command 1A 05). The number of the setting and the format of its value (00 ~ 99 or 0000 ~ 9999) are in the CI-V reference guide of the radio";
Blockly.Msg.ICOM_MENU_RANGE = "The number of the setting must be between 1 and 9999";
Blockly.Msg.ICOM_GET_MENU = "Menu Setting %1";
Blockly.Msg.ICOM_GET_MENU_TOOLTIP = "Reads a setting of the menu (command 1A 05) as number";

// ----------------------------------------------- radio/*.js: texts of the radio descriptions, looked up by their english text
// (see term() in radio/icom.js). The key is made from the english text (upper and lower case kept), which is repeated here as the text
Blockly.Msg.ICOM_TERM_OFF_10Hz_or_1Hz = "OFF (10Hz or 1Hz)";
Blockly.Msg.ICOM_TERM_Main_band = "Main band";
Blockly.Msg.ICOM_TERM_Sub_band = "Sub band";
Blockly.Msg.ICOM_TERM_A_band = "A band";
Blockly.Msg.ICOM_TERM_B_band = "B band";
Blockly.Msg.ICOM_TERM_VFO_A_and_VFO_B = "VFO A and VFO B";
Blockly.Msg.ICOM_TERM_main_and_sub_band = "main and sub band";
Blockly.Msg.ICOM_TERM_Split_on = "Split on";
Blockly.Msg.ICOM_TERM_Split_off = "Split off";
Blockly.Msg.ICOM_TERM_stop = "stop";
Blockly.Msg.ICOM_TERM_programmed_memory = "programmed/memory";
Blockly.Msg.ICOM_TERM_programmed = "programmed";
Blockly.Msg.ICOM_TERM_fine_programmed = "fine programmed";
Blockly.Msg.ICOM_TERM_fine_delta_F = "fine ΔF";
Blockly.Msg.ICOM_TERM_memory = "memory";
Blockly.Msg.ICOM_TERM_select_memory = "select memory";
Blockly.Msg.ICOM_TERM_mode_select = "mode select";
Blockly.Msg.ICOM_TERM_P_AMP_and_EXT_P_AMP = "P.AMP and EXT-P.AMP";
Blockly.Msg.ICOM_TERM_on = "on";
Blockly.Msg.ICOM_TERM_off = "off";
Blockly.Msg.ICOM_TERM_semi = "semi";
Blockly.Msg.ICOM_TERM_full = "full";
Blockly.Msg.ICOM_TERM_Attenuator_1 = "Attenuator %1";
Blockly.Msg.ICOM_TERM_Switches_the_20_dB_attenuator_on_or_off_HF_and_50_MHz_bands_only = "Switches the 20 dB attenuator on or off (HF and 50 MHz bands only)";
Blockly.Msg.ICOM_TERM_Sets_the_preamplifier_On_144_and_430_MHz_there_is_only_one_preamp_P_AMP1_on = "Sets the preamplifier. On 144 and 430 MHz there is only one preamp (P.AMP1 = on)";
Blockly.Msg.ICOM_TERM_Noise_Blanker = "Noise Blanker";
Blockly.Msg.ICOM_TERM_Noise_Reduction = "Noise Reduction";
Blockly.Msg.ICOM_TERM_Auto_Notch = "Auto Notch";
Blockly.Msg.ICOM_TERM_Manual_Notch = "Manual Notch";
Blockly.Msg.ICOM_TERM_Speech_Compressor = "Speech Compressor";
Blockly.Msg.ICOM_TERM_Repeater_Tone = "Repeater Tone";
Blockly.Msg.ICOM_TERM_Tone_Squelch = "Tone Squelch";
Blockly.Msg.ICOM_TERM_Twin_Peak_Filter = "Twin Peak Filter";
Blockly.Msg.ICOM_TERM_Satellite_Mode = "Satellite Mode";
Blockly.Msg.ICOM_TERM_Dial_Lock = "Dial Lock";
Blockly.Msg.ICOM_TERM_Reads_the_position_of_the_internal_GPS = "Reads the position of the internal GPS";
Blockly.Msg.ICOM_TERM_Reads_the_position_of_the_external_GPS_receiver_or_the_manually_entered_position = "Reads the position of the external GPS receiver, or the manually entered position";

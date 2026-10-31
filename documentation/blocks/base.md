# iCOMpadre

The blocks of the category *iCOMpadre* work with iCOMpadre itself: when your program runs, the connection to the radio, the pins of the connector, the serial interface and the SD card.
They are grouped by topic, and every group has its own colour:

| Group | Colour | Content |
|-------|--------|---------|
| [Program](#program) | <span style="color:#e0b65e">■</span> sand | when your program runs, timing |
| [Radio](#radio) | <span style="color:#5fa8c9">■</span> blue | sending your own CI-V commands to the radio |
| [Pins](#pins) | <span style="color:#9cc46b">■</span> green | inputs and outputs of the iCOMpadre connector |
| [Serial](#serial) | <span style="color:#b39ddb">■</span> lavender | the serial interface |
| [Storage](#storage) | <span style="color:#e39fb6">■</span> rose | remembering values, logs and files on the SD card |
| [Helpers](#helpers) | <span style="color:#a0a7ad">■</span> grey | conversions and comments |

The blocks of the radios (e.g. [IC-705](radio/ic705.md)) are blue as well, because they also talk to the radio.

---

## <span style="color:#e0b65e">■</span> Program {#program}

Events start your program, the other blocks control when something happens.

### OnStartup {#onstartup}

![OnStartup block](img/onstartup.png){ width="96" }

The blocks in here are executed **once**, when iCOMpadre starts. Use it to give your [variables](variables.md) a start value, or to set the pins and the serial interface up.

??? info "Lua code"
    ```lua
    function onStartup()
      level = 0
    end
    ```

### Periodically {#periodically}

![Periodically block](img/periodically.png){ width="104" }

The blocks in here are executed **over and over again**, as long as a radio is connected. This is the place for everything that should react to the radio, e.g. a limiter that watches the RF gain.

Keep the blocks in here short: iCOMpadre talks to the radio in between, and long programs slow that down.

??? info "Lua code"
    ```lua
    function periodically()
      ...
    end
    ```

### OnRadioConnected {#onradioconnected}

![OnRadioConnected block](img/onradioconnected.png){ width="149" }

The blocks in here are executed when the radio starts to answer: shortly after iCOMpadre starts (if the radio is on), and whenever the radio is switched on again.
Use it to bring the radio into a known state, e.g. to set the frequency or the RF power.

iCOMpadre asks the radio every second. While the radio is off, it keeps asking every 2 seconds, so it notices when the radio comes back.

??? info "Lua code"
    ```lua
    function onRadioConnected()
      ...
    end
    ```

### OnRadioDisconnected {#onradiodisconnected}

![OnRadioDisconnected block](img/onradiodisconnected.png){ width="167" }

The blocks in here are executed when the radio stops to answer for about a second, e.g. because it was switched off or the cable was unplugged.
[Periodically](#periodically) is not executed while the radio is disconnected.

??? info "Lua code"
    ```lua
    function onRadioDisconnected()
      ...
    end
    ```

### On change of {#onchangeof}

![On change of block](img/onchangeof.png){ width="125" }

Executes the inner blocks only when the watched value **changes**, and not every time. Put it into [Periodically](#periodically).

Example: *On change of* the operating mode, print the new mode. The mode is printed once after every change, instead of all the time.

??? info "Lua code"
    ```lua
    local actValue = getOperatingModeString(readResultOfCommand(sendCommand({0x04})))
    if(_G.lastValue ~= actValue ) then _G.lastValue = actValue
      print(actValue)
    end
    ```

### Wait {#wait}

![Wait block](img/wait.png){ width="118" }

Pauses your program for the given time in milliseconds (1000 ms = 1 second). iCOMpadre keeps talking to the radio while waiting.

Example: switch a pin on, *wait* 500 ms, switch it off again.

??? info "Lua code"
    ```lua
    wait(500)
    ```

### Execute Lua chunk {#executeluachunk}

![Execute Lua chunk block](img/executeluachunk.png){ width="163" }

Runs a piece of Lua code that is given as text. For experienced users who want to do something that no block offers. The *Help* of this block opens the Lua manual.

??? info "Lua code"
    ```lua
    load('print(1 + 2)')()
    ```

### Milliseconds since start {#millis}

![Milliseconds since start block](img/millis.png){ width="188" }

The time since iCOMpadre was started, in milliseconds. Useful to measure how long something takes, or to do something only every few seconds. After about 49 days it starts at 0 again.

??? info "Lua code"
    ```lua
    millis()
    ```

---

## <span style="color:#5fa8c9">■</span> Radio {#radio}

With these blocks you select the radio iCOMpadre talks to, and you can send any CI-V command to it, even if there is no ready-made block for it in the category of your radio.
The commands are described in the *CI-V reference guide* of your radio. Commands and answers are [lists](lists.md) of numbers.

### Connect to radio {#connect_radio}

![Connect to radio block](img/connect_radio.png){ width="390" }

Selects the radio iCOMpadre talks to, and how it is connected:

* **Bluetooth** for the IC-705, which has no REMOTE jack. This is what iCOMpadre does if there is no *Connect* block.
* **cable** for all other radios: connect the REMOTE jack of the radio to iCOMpadre with a mono cable (see [Radios](../../radios.md)). Choose the baud rate which is set as *CI-V Baud Rate* in the menu of the radio, or set the radio to *Auto*.

The block uses the default CI-V address of the radio, e.g. 94h for the IC-7300. Put it into [OnStartup](#onstartup), so it is executed before iCOMpadre talks to the radio.

??? info "Lua code"
    ```lua
    configCIV(0x98, "cable", 19200)   -- IC-7610 at the REMOTE jack
    configCIV(0xA4, "bluetooth")      -- IC-705
    ```

### Connect to CI-V address {#connect_address}

![Connect to CI-V address block](img/connect_address.png){ width="403" }

Like [Connect to radio](#connect_radio), but with the CI-V address in hex (01 ~ DF), as it is set in the menu of the radio.
You need it if you changed the address, e.g. because two radios of the same type share the CI-V bus.

??? info "Lua code"
    ```lua
    configCIV(0x96, "cable", 9600)
    ```

### Send command to radio {#sendcommand}

![Send command block](img/sendcommand.png){ width="190" }

Sends a command (and optional data) to the radio. Both are [lists](lists.md) of numbers.

Example: *command* = list with 20, 1 (`0x14 0x01`, AF level) and *data* = list with 1, 40 (`0x01 0x28`, the BCD value of 128) sets the AF level to about 50 %.

??? info "Lua code"
    ```lua
    sendCommand({20, 1}, {1, 40})
    ```

### Read data from radio {#readdata}

![Read data block](img/readdata.png){ width="183" }

Sends a command to the radio and returns its answer as [list](lists.md) of numbers.

Example: *Read data from radio* with the list 20, 1 returns the current AF level.

??? info "Lua code"
    ```lua
    readResultOfCommand(sendCommand({20, 1}))
    ```

### BCD values as number {#bcdasnumber}

![BCD values as number block](img/bcdasnumber.png){ width="198" }

Many radios send numbers as *BCD*: every half byte is one decimal digit. This block turns such an answer into a normal number, e.g. the list `0x01, 0x28` into 128.

??? info "Lua code"
    ```lua
    bcdToNumber(readResultOfCommand(sendCommand({20, 1})))
    ```

### Pretty {#prettystring}

![Pretty block](img/prettystring.png){ width="82" }

Turns a list of numbers into a readable text with hexadecimal values, e.g. `{0x14 ,0x01 }`. Combine it with [print](#text_print) to see what the radio answers.

??? info "Lua code"
    ```lua
    print(pretty(readResultOfCommand(sendCommand({20, 1}))))
    ```

---

## <span style="color:#9cc46b">■</span> Pins {#pins}

iCOMpadre has 8 pins (A to H) on its connector, to which you can connect switches, LEDs, relays or sensors.
All pins work with voltages between 0 V and 3.3 V.

### Set PIN to voltage {#setanalogoutput}

![Set PIN to voltage block](img/setanalogoutput.png){ width="130" }

Sets PIN A or PIN B to a voltage between 0 V and 3.3 V. Only these two pins can output a voltage.

Example: *Set PIN A to Voltage* 1.65 V.

??? info "Lua code"
    ```lua
    setAnalogOutput(PIN_A, 1.65)
    ```

### Set PIN to value {#setdigitaloutput}

![Set PIN to value block](img/setdigitaloutput.png){ width="130" }

Switches a pin on (*true*, 3.3 V) or off (*false*, 0 V), e.g. to light an LED or to switch a relay.

??? info "Lua code"
    ```lua
    setDigitalOutput(PIN_C, true)
    ```

### Voltage of PIN {#readanaloginput}

![Voltage of PIN block](img/readanaloginput.png){ width="173" }

Measures the voltage at a pin, in volts (0 to 3.3 V). Use it e.g. with a potentiometer.

??? info "Lua code"
    ```lua
    readAnalogInput(PIN_A)
    ```

### State of PIN {#readdigitalinput}

![State of PIN block](img/readdigitalinput.png){ width="158" }

Checks whether a pin is high (*true*) or low (*false*), e.g. if a switch is closed.

??? info "Lua code"
    ```lua
    readDigitalInput(PIN_C)
    ```

### Touch value of PIN {#touchvalue}

![Touch value block](img/touchvalue.png){ width="203" }

Pins C to H can be used as touch sensors: just connect a piece of metal. This block returns the raw measurement. The value **drops** when the pin is touched.
Use it to find the right threshold for your setup, otherwise [Is PIN touched](#isTouched) is easier to use.

??? info "Lua code"
    ```lua
    readTouchInput(PIN_C)
    ```

### Is PIN touched {#isTouched}

![Is PIN touched block](img/isTouched.png){ width="226" }

*True* if a touch pin is *touched* (or *released*, depending on the selection). Touched means a [touch value](#touchvalue) below 30.

Example: *if Is PIN C touched* then select VFO A.

??? info "Lua code"
    ```lua
    (readTouchInput(PIN_C) < 30)
    ```

### Voltage {#voltagevalue}

![Voltage block](img/voltagevalue.png){ width="94" }

A number with the unit *V* or *mV*. It makes programs easier to read: plug it into [Set PIN to voltage](#setanalogoutput), e.g. 500 mV.

??? info "Lua code"
    ```lua
    setAnalogOutput(PIN_A, 0.5)     -- 500 mV
    ```

---

## <span style="color:#b39ddb">■</span> Serial {#serial}

iCOMpadre has a serial interface (USB). Connect it to a computer and open a terminal program to see what your program prints, or to send commands to it.
The default speed is 115200 baud.

### OnSerialLine {#onserialline}

![OnSerialLine block](img/onserialline.png){ width="144" }

Executed whenever a complete line (finished with *Enter*) arrives on the serial interface. The variable *line* contains the text.

Example: if *line* = "vfo a" then select VFO A. This way you can control the radio from a computer.

??? info "Lua code"
    ```lua
    function onSerialLine(line)
      ...
    end
    ```

### OnSerialByte {#onserialbyte}

![OnSerialByte block](img/onserialbyte.png){ width="145" }

Executed for every single byte that arrives on the serial interface. The variable *byte* contains its value as number. Use [char of](#asChar) to turn it into a character.

??? info "Lua code"
    ```lua
    function onSerialByte(byte)
      ...
    end
    ```

### Print {#text_print}

![Print block](img/text_print.png){ width="66" }

Prints a text, a number or another value on the serial interface. The most important block to find out what your program is doing.

??? info "Lua code"
    ```lua
    print('Hello iCOMpadre')
    ```

### Set serial speed {#configserial}

![Set serial speed block](img/configserial.png){ width="249" }

Changes the speed of the serial interface, e.g. to talk to a device that only understands 9600 baud. Put it into [OnStartup](#onstartup).

??? info "Lua code"
    ```lua
    configSerial(9600)
    ```

---

## <span style="color:#e39fb6">■</span> Storage {#storage}

With these blocks your program can remember values and write logs on the SD card. Everything is kept when iCOMpadre is switched off.

!!! note "The folder /data"
    All files are stored in the folder `data` on the SD card. Your program cannot reach any other files there, so it can't damage the studio or itself.

    * File names may contain letters, digits, `_`, `-` and `.`, up to 32 characters, e.g. `log.csv`. Folders are not possible.
    * In the PROGRAM mode you can download your files with the browser, e.g. `http://icompadre.local/data/log.csv`, and open a CSV file in a spreadsheet.
    * If something goes wrong (e.g. no SD card or an invalid file name), a message is printed on the serial interface and the program continues.

### Remember {#storage_remember}

![Remember block](img/storage_remember.png){ width="188" }

Remembers a value under a name: a number, a text, *true* / *false* or a [list](lists.md). The value is kept on the SD card, also when iCOMpadre is switched off.
The SD card is only written when the value changes, so you can use this block in [Periodically](#periodically).

Example: *Remember* operating frequency *as* "last frequency", and tune to it again after switching on.

??? info "Lua code"
    ```lua
    kvSet("counter", 42)   -- stored in /data/memory.lua
    ```

### Forget {#storage_forget}

![Forget block](img/storage_forget.png){ width="102" }

Forgets the value remembered under the name.

??? info "Lua code"
    ```lua
    kvSet("counter", nil)
    ```

### Append line to file {#storage_append_line}

![Append line block](img/storage_append_line.png){ width="212" }

Adds a text as a new line at the end of a file. The file is created if it does not exist. Ideal for a log book of your program.

Example: *Append line* (*create text with* Radio Clock *time as text*, " ", operating frequency) *to file* "log.txt".

??? info "Lua code"
    ```lua
    storageAppendLine("log.txt", "12:34 14074000")
    ```

### Append values to CSV file {#storage_append_csv}

![Append values to CSV file block](img/storage_append_csv.png){ width="266" }

Adds the values of a [list](lists.md) as a new line to a CSV file, separated by commas. CSV files can be opened in every spreadsheet program, e.g. to draw a diagram of the supply voltage during a field day.

Example: *Append values* (*create list with* GPS Time *as text*, Supply Voltage, S-Meter) *to CSV file* "fieldday.csv".

??? info "Lua code"
    ```lua
    storageAppendLine("log.csv", storageCsvLine({"12:34", 12.6, 5}))
    ```

### Write text to file {#storage_write_file}

![Write text to file block](img/storage_write_file.png){ width="197" }

Writes a text into a file. The old content of the file is replaced.

??? info "Lua code"
    ```lua
    storageWrite("notes.txt", "Hello", "w")   -- io.open, file:write, file:close
    ```

### Delete file {#storage_delete_file}

![Delete file block](img/storage_delete_file.png){ width="125" }

Deletes a file, e.g. to start a new log.

??? info "Lua code"
    ```lua
    os.remove("log.csv")
    ```

### Recall {#storage_recall}

![Recall block](img/storage_recall.png){ width="193" }

Returns the value that has been remembered under the name. If nothing has been remembered yet, the value after *or else* is returned, e.g. 0 for a counter.

Example: count how often iCOMpadre was started: in [OnStartup](#onstartup) *Remember* (*Recall* "starts" *or else* 0) + 1 *as* "starts".

??? info "Lua code"
    ```lua
    kvGet("counter", 0)
    ```

### Lines of file {#storage_file_lines}

![Lines of file block](img/storage_file_lines.png){ width="142" }

Reads a file and returns its lines as a [list](lists.md). The list is empty if the file does not exist. Use [for each](control.md#controls_forEach) to go through the lines, and [make list from text](lists.md#lists_split) to split a CSV line.

??? info "Lua code"
    ```lua
    storageLines("log.txt")
    ```

### Text of file {#storage_read_file}

![Text of file block](img/storage_read_file.png){ width="133" }

Returns the whole content of a file as text. The text is empty if the file does not exist.

??? info "Lua code"
    ```lua
    (storageRead("notes.txt") or "")   -- io.open, file:read("a"), file:close
    ```

### File exists? {#storage_file_exists}

![File exists block](img/storage_file_exists.png){ width="147" }

*True* if the file exists.

??? info "Lua code"
    ```lua
    storageExists("log.csv")
    ```

---

## <span style="color:#a0a7ad">■</span> Helpers {#helpers}

### Comment {#comment}

![Comment block](img/comment.png){ width="111" }

A note in your program. It does nothing, but helps you (and others) to understand the program later.

??? info "Lua code"
    ```lua
    -- limits the RF gain to 30 %
    ```

### Map {#mapnumber}

![Map block](img/mapnumber.png){ width="442" }

Converts a number from one range into another one.

Example: a potentiometer delivers 0 to 3.3 V, the AF level needs 0 to 100 %: *map* voltage *from range of* 0 - 3.3 *to range from* 0 - 100.

??? info "Lua code"
    ```lua
    map(readAnalogInput(PIN_A), 0, 3.3, 0, 100)
    ```

### Char of {#asChar}

![Char of block](img/asChar.png){ width="90" }

Turns a number into the corresponding character, e.g. 65 into "A". Handy together with [OnSerialByte](#onserialbyte).

??? info "Lua code"
    ```lua
    string.char(65)
    ```

### Byte of character {#asByte}

![Byte of character block](img/asByte.png){ width="160" }

The opposite of [char of](#asChar): returns the number of the first character of a text, e.g. 65 for "A".

??? info "Lua code"
    ```lua
    string.byte("A")
    ```

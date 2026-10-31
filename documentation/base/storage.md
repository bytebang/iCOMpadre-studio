# Storage

With these blocks your program can remember values and write logs on the SD card. Everything is kept when iCOMpadre is switched off.

!!! note "The folder /data"
    All files are stored in the folder `data` on the SD card. Your program cannot reach any other files there, so it can't damage the studio or itself.

    * File names may contain letters, digits, `_`, `-` and `.`, up to 32 characters, e.g. `log.csv`. Folders are not possible.
    * In the PROGRAM mode you can download your files with the browser, e.g. `http://icompadre.local/data/log.csv`, and open a CSV file in a spreadsheet.
    * If something goes wrong (e.g. no SD card or an invalid file name), a message is printed on the serial interface and the program continues.

## Remember {#storage_remember}

![Remember block](../img/storage_remember.png){ width="188" }

Remembers a value under a name: a number, a text, *true* / *false* or a [list](../blockly/lists.md). The value is kept on the SD card, also when iCOMpadre is switched off.
The SD card is only written when the value changes, so you can use this block in [Periodically](program.md#periodically).

Example: *Remember* operating frequency *as* "last frequency", and tune to it again after switching on.

??? info "Lua code"
    ```lua
    kvSet("counter", 42)   -- stored in /data/memory.lua
    ```

## Forget {#storage_forget}

![Forget block](../img/storage_forget.png){ width="102" }

Forgets the value remembered under the name.

??? info "Lua code"
    ```lua
    kvSet("counter", nil)
    ```

## Append line to file {#storage_append_line}

![Append line block](../img/storage_append_line.png){ width="212" }

Adds a text as a new line at the end of a file. The file is created if it does not exist. Ideal for a log book of your program.

Example: *Append line* (*create text with* Radio Clock *time as text*, " ", operating frequency) *to file* "log.txt".

??? info "Lua code"
    ```lua
    storageAppendLine("log.txt", "12:34 14074000")
    ```

## Append values to CSV file {#storage_append_csv}

![Append values to CSV file block](../img/storage_append_csv.png){ width="266" }

Adds the values of a [list](../blockly/lists.md) as a new line to a CSV file, separated by commas. CSV files can be opened in every spreadsheet program, e.g. to draw a diagram of the supply voltage during a field day.

Example: *Append values* (*create list with* GPS Time *as text*, Supply Voltage, S-Meter) *to CSV file* "fieldday.csv".

??? info "Lua code"
    ```lua
    storageAppendLine("log.csv", storageCsvLine({"12:34", 12.6, 5}))
    ```

## Write text to file {#storage_write_file}

![Write text to file block](../img/storage_write_file.png){ width="197" }

Writes a text into a file. The old content of the file is replaced.

??? info "Lua code"
    ```lua
    storageWrite("notes.txt", "Hello", "w")   -- io.open, file:write, file:close
    ```

## Delete file {#storage_delete_file}

![Delete file block](../img/storage_delete_file.png){ width="125" }

Deletes a file, e.g. to start a new log.

??? info "Lua code"
    ```lua
    os.remove("log.csv")
    ```

## Recall {#storage_recall}

![Recall block](../img/storage_recall.png){ width="193" }

Returns the value that has been remembered under the name. If nothing has been remembered yet, the value after *or else* is returned, e.g. 0 for a counter.

Example: count how often iCOMpadre was started: in [OnStartup](program.md#onstartup) *Remember* (*Recall* "starts" *or else* 0) + 1 *as* "starts".

??? info "Lua code"
    ```lua
    kvGet("counter", 0)
    ```

## Lines of file {#storage_file_lines}

![Lines of file block](../img/storage_file_lines.png){ width="142" }

Reads a file and returns its lines as a [list](../blockly/lists.md). The list is empty if the file does not exist. Use [for each](../blockly/control.md#controls_forEach) to go through the lines, and [make list from text](../blockly/lists.md#lists_split) to split a CSV line.

??? info "Lua code"
    ```lua
    storageLines("log.txt")
    ```

## Text of file {#storage_read_file}

![Text of file block](../img/storage_read_file.png){ width="133" }

Returns the whole content of a file as text. The text is empty if the file does not exist.

??? info "Lua code"
    ```lua
    (storageRead("notes.txt") or "")   -- io.open, file:read("a"), file:close
    ```

## File exists? {#storage_file_exists}

![File exists block](../img/storage_file_exists.png){ width="147" }

*True* if the file exists.

??? info "Lua code"
    ```lua
    storageExists("log.csv")
    ```

# Helpers

## Comment {#comment}

![Comment block](../img/comment.png){ width="111" }

A note in your program. It does nothing, but helps you (and others) to understand the program later.

??? info "Lua code"
    ```lua
    -- limits the RF gain to 30 %
    ```

## Map {#mapnumber}

![Map block](../img/mapnumber.png){ width="442" }

Converts a number from one range into another one.

Example: a potentiometer delivers 0 to 3.3 V, the AF level needs 0 to 100 %: *map* voltage *from range of* 0 - 3.3 *to range from* 0 - 100.

??? info "Lua code"
    ```lua
    map(readAnalogInput(PIN_A), 0, 3.3, 0, 100)
    ```

## Char of {#asChar}

![Char of block](../img/asChar.png){ width="90" }

Turns a number into the corresponding character, e.g. 65 into "A". Handy together with [OnSerialByte](serial.md#onserialbyte).

??? info "Lua code"
    ```lua
    string.char(65)
    ```

## Byte of character {#asByte}

![Byte of character block](../img/asByte.png){ width="160" }

The opposite of [char of](helpers.md#asChar): returns the number of the first character of a text, e.g. 65 for "A".

??? info "Lua code"
    ```lua
    string.byte("A")
    ```

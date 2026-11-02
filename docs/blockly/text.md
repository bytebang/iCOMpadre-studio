# Text

Text blocks work with letters, words and lines, e.g. to put together a message for the serial interface.
Texts are printed with the [print](../base/serial.md#text_print) block of the iCOMpadre category.

!!! note "Counting starts at 1"
    The first letter of a text is letter number 1. Blocks that search in a text return 0 if they don't find anything.

---

## Text {#text}

![Text block](../img/text.png){ width="85" }

A fixed text, e.g. a callsign or a message. Click between the quotes to write it.

??? info "Lua code"
    ```lua
    name = 'OE6GUE'
    ```

---

## Multiline text {#text_multiline}

![Multiline text block](../img/text_multiline.png){ width="63" }

A fixed text with several lines.

??? info "Lua code"
    ```lua
    print('line 1' .. '\n' ..
    'line 2')
    ```

---

## Create text with {#text_join}

![Create text block](../img/text_join.png){ width="171" }

Joins several pieces into one text. Numbers are converted to text automatically. Click on the gear icon to add or remove places.

Example: *create text with* "Frequency: " and the frequency gives *Frequency: 7074000*.

??? info "Lua code"
    ```lua
    print('Frequency: ' .. freq)
    ```

---

## Append text {#text_append}

![Append text block](../img/text_append.png){ width="190" }

Adds a text to the end of a [variable](variables.md).

Example: *to* message *append text* " Hz".

??? info "Lua code"
    ```lua
    message = message .. ' Hz'
    ```

---

## Length of {#text_length}

![Length of text block](../img/text_length.png){ width="101" }

The number of characters of a text, spaces included.

??? info "Lua code"
    ```lua
    print(#name)
    ```

---

## Is empty {#text_isEmpty}

![Text is empty block](../img/text_isEmpty.png){ width="122" }

*True* if the text has no characters at all.

??? info "Lua code"
    ```lua
    print(#name == 0)
    ```

---

## Find occurrence of text {#text_indexOf}

![Find text block](../img/text_indexOf.png){ width="347" }

Searches a text in another one and returns the position of the *first* or *last* match. Returns 0 if it is not found.

Example: in "OE6GUE" the first "6" is at position 3.

??? info "Lua code"
    ```lua
    print(firstIndexOf(name, '6'))
    ```

---

## Count {#text_count}

![Count block](../img/text_count.png){ width="155" }

Counts how often a text occurs in another one.

Example: "E" occurs 2 times in "OE6GUE".

??? info "Lua code"
    ```lua
    print(text_count(name, 'E'))
    ```

---

## Replace {#text_replace}

![Replace block](../img/text_replace.png){ width="234" }

Replaces every occurrence of a text with another one.

Example: *replace* "OE6" *with* "OE3" *in* "OE6GUE" gives "OE3GUE".

??? info "Lua code"
    ```lua
    print(text_replace(name, 'OE6', 'OE3'))
    ```

---

## Reverse {#text_reverse}

![Reverse block](../img/text_reverse.png){ width="116" }

Writes a text backwards: "OE6GUE" becomes "EUG6EO".

??? info "Lua code"
    ```lua
    print(string.reverse(name))
    ```

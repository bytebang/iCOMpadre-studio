# Logic

Logic blocks answer questions with *true* or *false*, e.g. *"Is the AF level above 80 %?"*.
They are mostly used as condition of an [if block](control.md#controls_if).

---

## Compare {#logic_compare}

![Compare block](../img/logic_compare.png){ width="123" }

Compares two values and answers with *true* or *false*. Choose the comparison in the middle:

| Comparison | is *true* if ...                            |
|------------|---------------------------------------------|
| `=`        | both values are equal                       |
| `≠`        | the values are different                    |
| `<`        | the left value is smaller                   |
| `≤`        | the left value is smaller or equal          |
| `>`        | the left value is bigger                    |
| `≥`        | the left value is bigger or equal           |

Example: *AF Level `>` 80* is true, as soon as the volume is turned up above 80 %.

Numbers can only be compared with numbers, and texts with texts. Only `=` and `≠` work with everything.

??? info "Lua code"
    ```lua
    if level > 80 then
      print('too loud')
    end
    ```

---

## And / Or {#logic_operation}

![And / Or block](../img/logic_operation.png){ width="139" }

Combines two conditions into one.

* **and** is *true* only if **both** conditions are true.
* **or** is *true* if **at least one** of the conditions is true.

| left    | right   | and     | or      |
|---------|---------|---------|---------|
| *false* | *false* | *false* | *false* |
| *false* | *true*  | *false* | *true*  |
| *true*  | *false* | *false* | *true*  |
| *true*  | *true*  | *true*  | *true*  |

Example: *AF Level > 80* **and** *mode = FM*.

??? info "Lua code"
    ```lua
    if level > 80 and mode == 'FM' then
      print('loud FM')
    end
    ```

---

## True / False {#logic_boolean}

![True / False block](../img/logic_boolean.png){ width="79" }

The fixed value *true* or *false*. Use it to set a [variable](variables.md) or to switch a pin on (*true*) or off (*false*).

??? info "Lua code"
    ```lua
    step = true
    ```

---

## Not {#logic_negate}

![Not block](../img/logic_negate.png){ width="65" }

Turns *true* into *false* and *false* into *true*. Use it to check that something is **not** the case.

Example: **not** *State of PIN A* is true while PIN A is low.

??? info "Lua code"
    ```lua
    if not (readDigitalInput(PIN_A)) then
      print('PIN A is low')
    end
    ```

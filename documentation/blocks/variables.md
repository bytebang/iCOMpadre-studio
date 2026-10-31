# Variables

A variable remembers a value under a name, e.g. the last frequency or a counter.
Click on *Create variable...* in this category and give it a name. Afterwards the blocks below are available for it.

!!! note "Variables keep their value"
    A variable keeps its value as long as iCOMpadre is switched on, also from one run of [Periodically](base.md#periodically) to the next.
    That's handy to remember something. But a variable is empty until it has been set the first time.
    So give your variables a start value in [OnStartup](base.md#onstartup). Otherwise blocks like *level > 80* fail and an error message appears on the serial interface.

---

## Set {#variables_set}

![Set variable block](img/variables_set.png){ width="133" }

Stores a value in the variable. The old value is replaced.

Example: *set* level *to* 30.

??? info "Lua code"
    ```lua
    level = 30
    ```

---

## Change by {#math_change}

![Change variable block](img/math_change.png){ width="165" }

Adds a number to the variable. Use a negative number to subtract.

Example: *change* counter *by* 1 counts up.

??? info "Lua code"
    ```lua
    level = level + 5
    ```

---

## Get {#variables_get}

![Get variable block](img/variables_get.png){ width="81" }

Returns the current value of the variable, so it can be used in other blocks.

??? info "Lua code"
    ```lua
    print(level)
    ```

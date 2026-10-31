# Lists

A list holds several values in a fixed order. For iCOMpadre lists are especially important: CI-V commands and the answers of the radio are lists of numbers, e.g. *20, 1* for the command `0x14 0x01`.

!!! note "Counting starts at 1"
    The first item of a list is item number 1. Blocks that search for an item return 0 if they don't find it.

---

## Create list with {#lists_create_with}

![Create list block](img/lists_create_with.png){ width="165" }

Creates a list from the values plugged into it. Click on the gear icon to add or remove places.

Example: *create list with* 20, 1 is the CI-V command for the AF level.

??? info "Lua code"
    ```lua
    cmd = {20, 1}
    ```

---

## Length of {#lists_length}

![Length of list block](img/lists_length.png){ width="101" }

The number of items in a list.

??? info "Lua code"
    ```lua
    print(#cmd)
    ```

---

## Is empty {#lists_isEmpty}

![List is empty block](img/lists_isEmpty.png){ width="122" }

*True* if the list has no items.

??? info "Lua code"
    ```lua
    print(#cmd == 0)
    ```

---

## Find occurrence of item {#lists_indexOf}

![Find item block](img/lists_indexOf.png){ width="346" }

Searches the list for a value and returns its position: the *first* or the *last* place where it is found. Returns 0 if the value is not in the list.

??? info "Lua code"
    ```lua
    print(first_index(cmd, 1))
    ```

---

## Get item {#lists_getIndex}

![Get item block](img/lists_getIndex.png){ width="227" }

Reads an item from the list.

* **get** returns the item.
* **get and remove** returns the item and removes it from the list.
* **remove** only removes the item.

The position can be given as number (*#*), counted from the end (*# from end*), or as *first*, *last* or *random* item.

Example: *in list* answer *get #* 1 returns the first number of an answer of the radio.

??? info "Lua code"
    ```lua
    print(cmd[1])        -- get # 1
    print(cmd[#cmd])     -- get last
    ```

---

## Set item {#lists_setIndex}

![Set item block](img/lists_setIndex.png){ width="274" }

Changes a list.

* **set** replaces the item at the given position.
* **insert at** adds a new item at the given position. The following items move back by one.

??? info "Lua code"
    ```lua
    cmd[2] = 2                       -- set # 2 as 2
    table.insert(cmd, #cmd + 1, 0)   -- insert at last as 0
    ```

---

## Get sub-list {#lists_getSublist}

![Get sub-list block](img/lists_getSublist.png){ width="367" }

Returns a new list with a part of the items, e.g. all items *from #* 2 *to last*. The original list stays unchanged.

??? info "Lua code"
    ```lua
    print(list_sublist_from_start_last(cmd, 2))
    ```

---

## Make list from text {#lists_split}

![Make list from text block](img/lists_split.png){ width="335" }

Converts between texts and lists:

* **list from text** splits a text at every delimiter: "14,1" with delimiter "," becomes a list with "14" and "1".
* **text from list** joins all items to one text and puts the delimiter between them.

??? info "Lua code"
    ```lua
    cmd = list_string_split('14,1', ',')
    print(table.concat(cmd, ','))
    ```

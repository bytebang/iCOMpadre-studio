# Math

Math blocks calculate with numbers, e.g. to convert a value or to keep it within limits.

---

## Number {#math_number}

![Number block](../img/math_number.png){ width="45" }

A fixed number. Click on it to change it. Decimals are written with a point: `3.3`.

!!! tip "Hexadecimal values"
    The manuals of the radios write CI-V commands as hexadecimal values, e.g. `0x14`. Enter them as decimal number: `0x14` is `20`.

??? info "Lua code"
    ```lua
    freq = 7074000
    ```

---

## Arithmetic {#math_arithmetic}

![Arithmetic block](../img/math_arithmetic.png){ width="123" }

Calculates with two numbers. Choose the operation in the middle: `+` plus, `-` minus, `×` times, `÷` divided by, `^` to the power of.

Example: *frequency + 1000* is the frequency 1 kHz higher.

!!! note
    `÷` and `^` always give a decimal number, even if the result is whole: `7074000 ÷ 1000` gives `7074.0`.

??? info "Lua code"
    ```lua
    freq = freq + 1000
    ```

---

## Constrain {#math_constrain}

![Constrain block](../img/math_constrain.png){ width="258" }

Keeps a number between *low* and *high*: smaller values become *low*, bigger values become *high*, all others stay as they are.

Example: *constrain* RF Gain *low* 0 *high* 30 makes sure that the RF gain is never higher than 30 %.

??? info "Lua code"
    ```lua
    level = math.min(math.max(level, 0), 30)
    ```

---

## Remainder of {#math_modulo}

![Remainder block](../img/math_modulo.png){ width="198" }

The remainder of a division: 17 ÷ 5 is 3, remainder **2**.

Example: the remainder of a counter ÷ 10 is 0 every 10th time, which is handy to do something only every now and then.

??? info "Lua code"
    ```lua
    print(17 % 5)
    ```

---

## Sum of list {#math_on_list}

![Sum of list block](../img/math_on_list.png){ width="133" }

Calculates one value from all numbers of a [list](lists.md):

| Operation          | Result                                     |
|--------------------|--------------------------------------------|
| sum                | all numbers added up                       |
| min / max          | the smallest / biggest number              |
| average            | the average                                |
| median             | the value in the middle of the sorted list |
| modes              | a list of the most frequent numbers        |
| standard deviation | how much the numbers spread                |
| random item        | a randomly chosen item                     |

??? info "Lua code"
    ```lua
    function math_sum(t)
      local result = 0
      for _, v in ipairs(t) do
        result = result + v
      end
      return result
    end

    print(math_sum({1, 2, 3}))
    ```

---

## Is even {#math_number_property}

![Is even block](../img/math_number_property.png){ width="136" }

Checks a number and answers with *true* or *false*. You can check whether it is *even*, *odd*, *prime*, *whole*, *positive*, *negative* or *divisible by* another number.

??? info "Lua code"
    ```lua
    if i % 2 == 0 then
      print('even')
    end
    ```

---

## Constant {#math_constant}

![Constant block](../img/math_constant.png){ width="63" }

A mathematical constant: π (3.141…), e (2.718…), φ (1.618…), sqrt(2) (1.414…), sqrt(½) (0.707…) or ∞ (infinity).

??? info "Lua code"
    ```lua
    print(math.pi)
    ```

---

## Square root {#math_single}

![Square root block](../img/math_single.png){ width="135" }

Applies a function to a number:

| Function    | Result                         |
|-------------|--------------------------------|
| square root | √16 is 4                       |
| absolute    | the number without sign: -5 becomes 5 |
| -           | changes the sign: 5 becomes -5 |
| ln          | natural logarithm              |
| log10       | logarithm to base 10           |
| e^          | e to the power of the number   |
| 10^         | 10 to the power of the number  |

??? info "Lua code"
    ```lua
    print(math.sqrt(16))
    ```

# Program

Events start your program, the other blocks control when something happens.

!!! warning "Every event only once"
    Each event block (OnStartup, Periodically, OnRadioConnected, ...) may only be once in a program. If there are two of them,
    only one is executed, and the studio shows a warning at both. Put all blocks into one of them and delete the others.

## OnStartup {#onstartup}

![OnStartup block](../img/onstartup.png){ width="96" }

The blocks in here are executed **once**, when iCOMpadre starts. Use it to give your [variables](../blockly/variables.md) a start value, or to set the pins and the serial interface up.

??? info "Lua code"
    ```lua
    function onStartup()
      level = 0
    end
    ```

## Periodically {#periodically}

![Periodically block](../img/periodically.png){ width="104" }

The blocks in here are executed **over and over again**, as long as a radio is connected. This is the place for everything that should react to the radio, e.g. a limiter that watches the RF gain.

Keep the blocks in here short: iCOMpadre talks to the radio in between, and long programs slow that down.

??? info "Lua code"
    ```lua
    function periodically()
      ...
    end
    ```

## OnRadioConnected {#onradioconnected}

![OnRadioConnected block](../img/onradioconnected.png){ width="149" }

The blocks in here are executed when the radio starts to answer: shortly after iCOMpadre starts (if the radio is on), and whenever the radio is switched on again.
Use it to bring the radio into a known state, e.g. to set the frequency or the RF power.

iCOMpadre asks the radio every second. While the radio is off, it keeps asking every 2 seconds, so it notices when the radio comes back.

??? info "Lua code"
    ```lua
    function onRadioConnected()
      ...
    end
    ```

## OnRadioDisconnected {#onradiodisconnected}

![OnRadioDisconnected block](../img/onradiodisconnected.png){ width="167" }

The blocks in here are executed when the radio stops to answer for about a second, e.g. because it was switched off or the cable was unplugged.
[Periodically](program.md#periodically) is not executed while the radio is disconnected.

??? info "Lua code"
    ```lua
    function onRadioDisconnected()
      ...
    end
    ```

## On change of {#onchangeof}

![On change of block](../img/onchangeof.png){ width="125" }

Executes the inner blocks only when the watched value **changes**, and not every time. Put it into [Periodically](program.md#periodically).

Example: *On change of* the operating mode, print the new mode. The mode is printed once after every change, instead of all the time.

??? info "Lua code"
    ```lua
    local actValue = icomName(icomQuery({0x04}), {[0] = "LSB", [1] = "USB", ...}, "Unknown")   -- Operating Mode of the IC-705
    if(_G.lastValue ~= actValue ) then _G.lastValue = actValue
      print(actValue)
    end
    ```

## Wait {#wait}

![Wait block](../img/wait.png){ width="118" }

Pauses your program for the given time in milliseconds (1000 ms = 1 second). iCOMpadre keeps talking to the radio while waiting.

Example: switch a pin on, *wait* 500 ms, switch it off again.

??? info "Lua code"
    ```lua
    wait(500)
    ```

## Execute Lua chunk {#executeluachunk}

![Execute Lua chunk block](../img/executeluachunk.png){ width="163" }

Runs a piece of Lua code that is given as text. For experienced users who want to do something that no block offers. The *Help* of this block opens the Lua manual.

??? info "Lua code"
    ```lua
    load('print(1 + 2)')()
    ```

## Milliseconds since start {#millis}

![Milliseconds since start block](../img/millis.png){ width="188" }

The time since iCOMpadre was started, in milliseconds. Useful to measure how long something takes, or to do something only every few seconds. After about 49 days it starts at 0 again.

??? info "Lua code"
    ```lua
    millis()
    ```

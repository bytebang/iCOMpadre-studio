# Pins

iCOMpadre has 8 pins (A to H) on its connector, to which you can connect switches, LEDs, relays or sensors.
All pins work with voltages between 0 V and 3.3 V.

## Set PIN to voltage {#setanalogoutput}

![Set PIN to voltage block](../img/setanalogoutput.png){ width="130" }

Sets PIN A or PIN B to a voltage between 0 V and 3.3 V. Only these two pins can output a voltage.

Example: *Set PIN A to Voltage* 1.65 V.

??? info "Lua code"
    ```lua
    setAnalogOutput(PIN_A, 1.65)
    ```

## Set PIN to value {#setdigitaloutput}

![Set PIN to value block](../img/setdigitaloutput.png){ width="130" }

Switches a pin on (*true*, 3.3 V) or off (*false*, 0 V), e.g. to light an LED or to switch a relay.

??? info "Lua code"
    ```lua
    setDigitalOutput(PIN_C, true)
    ```

## Voltage of PIN {#readanaloginput}

![Voltage of PIN block](../img/readanaloginput.png){ width="173" }

Measures the voltage at a pin, in volts (0 to 3.3 V). Use it e.g. with a potentiometer.

??? info "Lua code"
    ```lua
    readAnalogInput(PIN_A)
    ```

## State of PIN {#readdigitalinput}

![State of PIN block](../img/readdigitalinput.png){ width="158" }

Checks whether a pin is high (*true*) or low (*false*), e.g. if a switch is closed.

??? info "Lua code"
    ```lua
    readDigitalInput(PIN_C)
    ```

## Touch value of PIN {#touchvalue}

![Touch value block](../img/touchvalue.png){ width="203" }

Pins C to H can be used as touch sensors: just connect a piece of metal. This block returns the raw measurement. The value **drops** when the pin is touched.
Use it to find the right threshold for your setup, otherwise [Is PIN touched](pins.md#isTouched) is easier to use.

??? info "Lua code"
    ```lua
    readTouchInput(PIN_C)
    ```

## Is PIN touched {#isTouched}

![Is PIN touched block](../img/isTouched.png){ width="226" }

*True* if a touch pin is *touched* (or *released*, depending on the selection). Touched means a [touch value](pins.md#touchvalue) below 30.

Example: *if Is PIN C touched* then select VFO A.

??? info "Lua code"
    ```lua
    (readTouchInput(PIN_C) < 30)
    ```

## Voltage {#voltagevalue}

![Voltage block](../img/voltagevalue.png){ width="94" }

A number with the unit *V* or *mV*. It makes programs easier to read: plug it into [Set PIN to voltage](pins.md#setanalogoutput), e.g. 500 mV.

??? info "Lua code"
    ```lua
    setAnalogOutput(PIN_A, 0.5)     -- 500 mV
    ```

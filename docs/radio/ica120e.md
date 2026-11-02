# IC-A120E

The blocks of the category *IC-A120E* control the ICOM IC-A120E. They are grouped by topic:

| Group | Content |
|-------|---------|
| [Frequency & Mode](#frequency) | frequency, mode |
| [Receiver](#receiver) | volume, squelch, squelch status |
| [Transmit](#transmit) | transmitting |
| [Settings](#settings) | power on/off |

Blocks that read a value use the **last answer** of the radio, see [Reading values from the radio](../blocks.md#reading-values).

!!! warning "Connect to the radio first"
    By default iCOMpadre talks to an IC-705 via Bluetooth. Put the block
    [Connect to IC-A120E via cable](../base/radio.md#connect_radio) into [OnStartup](../base/program.md#onstartup),
    and connect the REMOTE jack of the radio to iCOMpadre with a mono cable. The block uses the default CI-V address of the IC-A120E (92h);
    if you changed it in the menu of the radio, use [Connect to CI-V address](../base/radio.md#connect_address) instead.
    The baud rate of the block has to match the CI-V baud rate of the radio (or set the radio to *Auto*).

The CI-V commands and page numbers refer to the *IC-A120E Bedienungsanleitung (German), chapter 10*.
All blocks are created from the description of the radio in `studio/radio/ica120e.js`.

---

## <span style="color:#5fa8c9">■</span> Frequency & Mode {#frequency}

### Set Frequency {#ica120e_set_frequency}

![Set Frequency block](../img/ica120e_set_frequency.png){ width="208" }

Sets the frequency of the radio.

CI-V: `05 + 5 bytes BCD, least significant byte first` (p. 10-3)

??? info "Lua code"
    ```lua
    sendCommand({0x05}, frequencyToBcd(118.1 * 1e6, 5))
    ```

### Set Operating Mode {#ica120e_set_operating_mode}

![Set Operating Mode block](../img/ica120e_set_operating_mode.png){ width="217" }

Sets the operating mode of the radio.
Choices: *AM*, *AM-N*.

CI-V: `06 + mode` (p. 10-3)

??? info "Lua code"
    ```lua
    sendCommand({0x06}, {0x02, 0x01})
    ```

### Operating frequency {#ica120e_get_operating_frequency}

![Operating frequency block](../img/ica120e_get_operating_frequency.png){ width="219" }

Reads the current frequency of the radio.

CI-V: `03` (p. 10-3)

??? info "Lua code"
    ```lua
    icomReadFrequency()
    ```

### Operating Mode {#ica120e_get_operating_mode}

![Operating Mode block](../img/ica120e_get_operating_mode.png){ width="134" }

Reads the current operating mode of the radio (AM or AM-N).

CI-V: `04` (p. 10-3)

??? info "Lua code"
    ```lua
    icomName(icomQuery({0x04}), {[513] = "AM", [514] = "AM-N"}, "Unknown")
    ```

---

## <span style="color:#5fa8c9">■</span> Receiver {#receiver}

### Set AF Level {#ica120e_set_af_level}

![Set AF Level block](../img/ica120e_set_af_level.png){ width="174" }

Sets the AF output level (volume) (in %).

CI-V: `14 01 + 0000 ~ 0255` (p. 10-3)

??? info "Lua code"
    ```lua
    sendCommand({0x14, 0x01}, icomPercent(50))
    ```

### AF Level {#ica120e_get_af_level}

![AF Level block](../img/ica120e_get_af_level.png){ width="86" }

Reads the AF output level (volume) (in %).

CI-V: `14 01 -> 0000 ~ 0255` (p. 10-3)

??? info "Lua code"
    ```lua
    icomReadPercent({0x14, 0x01})
    ```

### Set Squelch Level {#ica120e_set_squelch_level}

![Set Squelch Level block](../img/ica120e_set_squelch_level.png){ width="210" }

Sets the squelch level (in %).

CI-V: `14 03 + 0000 ~ 0255` (p. 10-4)

??? info "Lua code"
    ```lua
    sendCommand({0x14, 0x03}, icomPercent(50))
    ```

### Squelch Level {#ica120e_get_squelch_level}

![Squelch Level block](../img/ica120e_get_squelch_level.png){ width="121" }

Reads the squelch level (in %).

CI-V: `14 03 -> 0000 ~ 0255` (p. 10-4)

??? info "Lua code"
    ```lua
    icomReadPercent({0x14, 0x03})
    ```

### Is Squelch open? {#ica120e_is_squelch_open}

![Is Squelch open? block](../img/ica120e_is_squelch_open.png){ width="142" }

*True* if the squelch is open, i.e. a signal is received.

CI-V: `15 05 -> 00 (closed) / 01 (open)` (p. 10-3)

??? info "Lua code"
    ```lua
    icomReadOn({0x15, 0x05})
    ```

---

## <span style="color:#5fa8c9">■</span> Transmit {#transmit}

### Transmit {#ica120e_set_transmit}

![Transmit block](../img/ica120e_set_transmit.png){ width="153" }

Switches the transmitter on (like pressing PTT) or back to receive. Make sure your program switches it off again!.

CI-V: `1C 00 + 00 (RX) / 01 (TX)` (p. 10-3)

??? info "Lua code"
    ```lua
    sendCommand({0x1C, 0x00}, {0x01})
    ```

### Is Transmitting? {#ica120e_is_transmitting}

![Is Transmitting? block](../img/ica120e_is_transmitting.png){ width="132" }

True while the radio transmits.

CI-V: `1C 00 -> 00 (RX) / 01 (TX)` (p. 10-3)

??? info "Lua code"
    ```lua
    icomReadOn({0x1C, 0x00})
    ```

---

## <span style="color:#5fa8c9">■</span> Settings {#settings}

### Switch Radio {#ica120e_set_power}

![Switch Radio block](../img/ica120e_set_power.png){ width="149" }

Switches the radio off or on. Switching on only works if the radio is in standby.

CI-V: `18 00 (off) / 18 01 (on)` (p. 10-3)

??? info "Lua code"
    ```lua
    sendCommand({0x18, 0x00})
    ```

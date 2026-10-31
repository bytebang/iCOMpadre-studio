# Serial

iCOMpadre has a serial interface (USB). Connect it to a computer and open a terminal program to see what your program prints, or to send commands to it.
The default speed is 115200 baud.

## OnSerialLine {#onserialline}

![OnSerialLine block](../img/onserialline.png){ width="144" }

Executed whenever a complete line (finished with *Enter*) arrives on the serial interface. The variable *line* contains the text.

Example: if *line* = "vfo a" then select VFO A. This way you can control the radio from a computer.

??? info "Lua code"
    ```lua
    function onSerialLine(line)
      ...
    end
    ```

## OnSerialByte {#onserialbyte}

![OnSerialByte block](../img/onserialbyte.png){ width="145" }

Executed for every single byte that arrives on the serial interface. The variable *byte* contains its value as number. Use [char of](helpers.md#asChar) to turn it into a character.

??? info "Lua code"
    ```lua
    function onSerialByte(byte)
      ...
    end
    ```

## Print {#text_print}

![Print block](../img/text_print.png){ width="66" }

Prints a text, a number or another value on the serial interface. The most important block to find out what your program is doing.

??? info "Lua code"
    ```lua
    print('Hello iCOMpadre')
    ```

## Set serial speed {#configserial}

![Set serial speed block](../img/configserial.png){ width="249" }

Changes the speed of the serial interface, e.g. to talk to a device that only understands 9600 baud. Put it into [OnStartup](program.md#onstartup).

??? info "Lua code"
    ```lua
    configSerial(9600)
    ```

# Overview

iCOMpadre-studio is the code editor for iCOMpadre and it runs usually of the SD card in the PROGRAM mode. There it produces the `main.lua` file which is executed in RUN mode.

## General usage

The interface is easy to use. On the left pane there is a selection of [blocks](blocks.md) that can be dragged to the workspace and there they can be connected to meaningful programs. Lets have a look how a RF Gain Limiter to 30% for the IC-705 can be implemented in 60 seconds: 

![RF Gain Limiter in 60 seconds](rfgain-limiter.gif)

These blocks can be put together to get a running program. [First steps with blockly](https://www.youtube.com/watch?v=lPVJjQbEeN0) gives a good introduction how this works.

Depending which, and how the blocks are joined togehter iCOMpadre-studio creates a `main.lua` file which is stored on the sd card.
When iCOMpadre is started up the next time in the run mode, then this file will be executed.

## Where to go next

* [Editor](editor.md): the buttons of the studio, saving, restoring and sharing your work
* [Tutorial](tutorial.md): five small programs which show step by step how to write your own
* [Blocks](blocks.md): the kinds of blocks and how they work together

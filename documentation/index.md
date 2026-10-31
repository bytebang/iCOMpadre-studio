# Overview

iCOMpadre-studio is the code editor for iCOMpadre and it runs usually of the SD card in the PROGRAM mode. There it produces the `main.lua` file which is executed in RUN mode.

## General usage

The interface is easy to use. On the left pane there is a selection of [blocks](/studio/blocks/) that can be dragged to the workspace and there they can be connected to meaningful programs. Lets have a look how a RF Gain Limiter to 30% for the IC-705 can be implemented in 60 seconds: 

![RF Gain Limiter in 60 seconds](rfgain-limiter.gif)

These blocks can be put together to get a running program. [First steps with blockly](https://www.youtube.com/watch?v=lPVJjQbEeN0) gives a good introduction how this works.

Depending which, and how the blocks are joined togehter iCOMpadre-studio creates a `main.lua` file which is stored on the sd card.
When iCOMpadre is started up the next time in the run mode, then this file will be executed.

### Action Buttons

The dashed buttons at the top right:

| Button                      | Functionality                 |
|-----------------------------|-------------------------------|
| ![Save](button-save.png)    | The **save** button compiles the current sketch and stores it on iCOMpadre (as `main.lua` and `icompadre.json`). `ctrl+s` does the same. A dot on the button shows that there are unsaved changes. Next to the buttons you can see whether saving worked. |
| ![Download](button-download.png)    | The **download** button downloads the current sketch to your computer. The filename contains the date, e.g. `icompadre-2024-12-31.json`. |
| ![Open](button-open.png)    | The **open** button replaces the current sketch with one that you select from your computer. You can also drop the file onto the button. `ctrl+z` brings the previous sketch back. |
| ![Share](button-share.png)    | The **share** button shows the current sketch as text, so it can be shared via mail, pastebin or other techniques. Paste the text of someone else's sketch there and press **Import** to open it. |
| ![Lua](button-lua.png)    | The **lua** button shows the lua code which is generated from the sketch, next to the workspace. It is updated while you work. From there it can be copied or downloaded as `main.lua`. |

### Unsaved changes

Changes which are not saved on iCOMpadre yet are kept in your browser. If the browser is closed (or crashes) before you save, the studio offers to restore them the next time you open it.

## Sharing Recipies

If you have a cool solution that you want to share with others, please do so, by pasting it onto [pastebin](https://pastebin.com/) with the hashtag `#icompadre`. The title should give a hint what the solution is about.

## Updates

You can always update the version by downloading the newest [version from GitHub](https://github.com/bytebang/iCOMpadre-studio/releases) onto a SD card and by inserting it into iCOMpadre. Read the update notes to detect breaking changed which may lead to data loss.

## Legal

This software is dual licensed:

#### AGPLv3 for private use:

You may use, copy, modify, and distribute this software under the terms of the Affero General Public License Version 3 (AGPLv3). The AGPLv3 requires that modified code, when provided over a network, be released under the AGPLv3 as well. For more information, see the AGPLv3 license file.

#### Proprietary license for commercial use:

A separate proprietary license is available for commercial use of this software. The proprietary license grants you additional rights and restrictions beyond the provisions of the AGPLv3. Please contact us for information on commercial licensing.

#### Discalimer
IMPORTANT: I DO NOT ASSUME ANY RESPONSIBILITY FOR YOUR USE OF THIS SOFTWARE, AND I MAKE NO REPRESENTATIONS ABOUT ITS SAFETY, APPROPRIATENESS, OR USE FOR A PARTICULAR PURPOSE. USE OF THIS SOFTWARE IS AS-IS.
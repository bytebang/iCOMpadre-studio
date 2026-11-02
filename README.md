# iCOMpadre-studio

[![Tests](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/tests.yml)
[![SD card package](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/sdcard.yml/badge.svg?branch=main)](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/sdcard.yml)
[![Online demo and documentation](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/docs.yml/badge.svg?branch=main)](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/docs.yml)

This is a blockly based IDE for iCOMpadre. Try the [latest version of iCOMpadre Studio](https://bytebang.github.io/iCOMpadre-studio/) online, or read the [user guide](https://bytebang.github.io/iCOMpadre-studio/studio/docs/).

## Deployment

### Install on an SD card

1. Open the [latest Studio SD card package build on `main`](https://github.com/bytebang/iCOMpadre-studio/actions/workflows/sdcard.yml?query=branch%3Amain+event%3Apush).
2. Select the most recent successful run and download the **`sdcard-studio`** artifact from its *Artifacts* section.

The ZIP contains an outer `studio/` folder. Where you extract that folder determines how Studio starts:

* **Studio is the only app:** extract the *contents* of the outer `studio/` folder to the SD card root. Its `index.html` starts Studio automatically; the editor is at `/studio/index.html` and the help at `/docs/`.
* **Several apps:** extract the full ZIP to the SD card root, keeping the outer `studio/` folder. Studio is one app among the others; its preloader is `/studio/index.html`, the editor is `/studio/studio/index.html`, and the help is `/studio/docs/`.


## See it in action

[![iCOMpadre Studio: an RF gain limiter in action](./docs/rfgain-limiter.gif)](./docs/rfgain-limiter.gif)

For development details and instructions on adding radio support, see [DEVELOPING.md](DEVELOPING.md).

# license 

This software is dual licensed:

AGPLv3 for private use:
- You may use, copy, modify, and distribute this software under the terms of the Affero General Public License Version 3 (AGPLv3). The AGPLv3 requires that modified code, when provided over a network, be released under the AGPLv3 as well. For more information, see the [AGPLv3 license file](./sdcard/LICENSE-AGPLv3.txt).

Proprietary license for commercial use:
- A separate proprietary license is available for commercial use of this software. The proprietary license grants you additional rights and restrictions beyond the provisions of the AGPLv3. Please contact us for information on commercial licensing.

If you use, copy, modify, or distribute this software, you must comply with the respective license terms. Please refer to the specific license files for more information.


# fine print

IMPORTANT: I DO NOT ASSUME ANY RESPONSIBILITY FOR YOUR USE OF THIS SOFTWARE, AND I MAKE NO REPRESENTATIONS ABOUT ITS SAFETY, APPROPRIATENESS, OR USE FOR A PARTICULAR PURPOSE. USE OF THIS SOFTWARE IS AS-IS.

Günther Hutter - OE6GUE

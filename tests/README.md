# Tests

Automated tests of the studio. They run the studio in a headless browser (Chrome, Chromium or Edge) with a small web server, which behaves like iCOMpadre in program mode.

```sh
pip install lupa              # Lua 5.3 for test_lua.py
python tests/run_all.py       # all tests
python tests/test_ui.py       # or one of them
```

If the browser is not found, set `STUDIO_BROWSER` to its path.
The GitHub action `.github/workflows/tests.yml` runs all tests on every push.

| Test | What it checks |
| --- | --- |
| `test_generated_code.py` | The lua code of every block of the toolbox is the same as in `expected_lua.json`, every block generates code, and the iCOMpadre blocks generate the same code in every language. |
| `test_lua.py` | The radio blocks run in Lua 5.3 with a simulated firmware: without answers (right after the start) and with answers. Read blocks return the right values for known answers, action blocks send the right bytes. |
| `test_ui.py` | Loading and saving, unsaved changes and their backup in the browser, open / import / share, the lua panel, ctrl+s, dark mode, phone width, another language, errors of the loader. |
| `test_i18n.py` | The texts in `msg/`: translations have no unknown texts and the same placeholders as english, every text is used, translated block files contain no texts of their own (no browser needed). |

The browser runs with english as its language, because the studio follows the language of the browser.

## When test_generated_code.py fails

It shows the differences between the expected and the generated code. If the change is intended (e.g. a new block or a fixed generator), update the expected code and commit it together with the change:

```sh
python tests/test_generated_code.py --update
git diff tests/expected_lua.json   # check that only what you wanted has changed
```

## The simulated firmware

`test_lua.py` provides `sendCommand` and `readResultOfCommand` like the firmware does. The answers of the radio are passed as **floats**, because the firmware uses `lua_pushnumber`. That matters: `tostring(18.0)` is `"18.0"`, so names of settings must be looked up with numbers as keys, not with strings.

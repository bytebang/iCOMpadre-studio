"""Tests the user interface of the studio in a headless browser: loading, saving, unsaved changes and backup,
open / import / share, the lua panel, dark mode, phone width and the loader."""
import json
import os
import sys

from harness import STUDIO_READY, Browser, Checks, Server, open_studio

ON_STARTUP_WITH_PRINT = {"type": "onstartup", "x": 40, "y": 40,
                         "inputs": {"actions": {"block": {"type": "text_print",
                                                          "inputs": {"TEXT": {"block": {"type": "text", "fields": {"TEXT": "hello"}}}}}}}}


def main():
    checks = Checks()
    check = checks.check
    server, browser = Server(), Browser()
    page = browser.page

    def add_block(state):
        page.eval("void Blockly.serialization.blocks.append(%s, icompadreWorkspace)" % json.dumps(state))

    def reload():
        page.eval("window.__beforeReload = true")
        page.call("Page.reload")
        page.wait("!window.__beforeReload && " + STUDIO_READY, 60)

    def undo():
        # blockly fires its events asynchronously: let them reach the undo stack first
        page.eval("new Promise(function(resolve) { setTimeout(resolve, 50); })")
        page.eval("void icompadreWorkspace.undo(false)")

    def blocks():
        return page.eval("icompadreWorkspace.getAllBlocks(false).length")

    status = "document.getElementById('status')"

    try:
        # loader and start
        open_studio(page, server, "/")
        check("the loader opens the studio", page.eval("location.pathname") == "/studio/index.html")
        check("the save button is enabled after loading", page.eval("!document.getElementById('saveButton').disabled"))
        check("no unsaved changes after loading", page.eval("!isDirty()"))

        # unsaved changes and backup
        add_block(ON_STARTUP_WITH_PRINT)
        page.wait("document.getElementById('saveButton').classList.contains('dirty')")
        check("the title marks unsaved changes", page.eval("document.title.startsWith('\\u25CF')"))
        page.wait("localStorage.getItem(BACKUP_KEY) !== null")
        check("unsaved changes are kept in the browser", True)

        # save
        page.eval("document.getElementById('saveButton').click()")
        page.wait(status + ".className === 'ok' && !saving")
        check("the status tells that it was saved", page.eval(status + ".textContent").startswith("Saved on iCOMpadre"))
        page.wait("!document.getElementById('saveButton').classList.contains('dirty') && localStorage.getItem(BACKUP_KEY) === null")
        check("after saving: no unsaved changes and no backup", True)
        lua = open(server.file("main.lua"), encoding="utf-8").read()
        check("main.lua is stored", "function onStartup()" in lua and "hello" in lua, lua)
        check("icompadre.json is stored", "onstartup" in open(server.file("icompadre.json"), encoding="utf-8").read())

        # reload: the stored sketch, no backup offered
        reload()
        check("the stored sketch is loaded", blocks() == 3, blocks())
        check("no restore banner without unsaved changes", page.eval("document.getElementById('restoreBanner').hidden"))

        # unsaved changes survive a reload
        add_block({"type": "periodically", "x": 400, "y": 40})
        page.wait("localStorage.getItem(BACKUP_KEY) !== null && JSON.parse(localStorage.getItem(BACKUP_KEY)).sketch.includes('periodically')")
        reload()
        check("the restore banner is shown", not page.eval("document.getElementById('restoreBanner').hidden"))
        page.eval("document.getElementById('restoreButton').click()")
        page.wait("icompadreWorkspace.getBlocksByType('periodically').length == 1")
        check("restore brings the unsaved changes back", True)
        page.wait("isDirty()")
        undo()
        page.wait("icompadreWorkspace.getBlocksByType('periodically').length == 0")
        check("restore can be undone", True)

        # saving fails
        page.eval("window._fetch = window.fetch; window.fetch = function() { return Promise.reject(new TypeError('Failed to fetch')); }")
        page.eval("saveWorkspace()")
        check("no connection is reported", "not reachable" in page.eval(status + ".textContent"), page.eval(status + ".textContent"))
        page.eval("window.fetch = function() { return Promise.resolve(new Response('', {status: 500, statusText: 'Internal Server Error'})); }")
        page.eval("saveWorkspace()")
        check("an HTTP error is reported", "500" in page.eval(status + ".textContent"), page.eval(status + ".textContent"))
        page.eval("window.fetch = window._fetch")
        check("the save button works again after an error", page.eval("!document.getElementById('saveButton').disabled"))

        # open a file
        page.eval("openSketchFile(new File(['no json'], 'bad.json'))")
        page.wait(status + ".textContent.includes('bad.json')")
        check("an invalid file is reported", page.eval(status + ".className") == "error")
        check("an invalid file doesn't change the sketch", blocks() == 3, blocks())
        page.eval("openSketchFile(new File([JSON.stringify({'blocks': {'languageVersion': 0, 'blocks': [{'type': 'periodically'}]}})], 'good.json'))")
        page.wait("icompadreWorkspace.getAllBlocks(false).length == 1")
        check("a valid file is opened", True)
        undo()
        page.wait("icompadreWorkspace.getAllBlocks(false).length == 3")
        check("opening can be undone", True)

        # share window
        page.eval("document.getElementById('shareButton').click()")
        check("the share window shows the sketch", page.eval("shareDialog.open && shareText.value.includes('onstartup')"))
        page.eval("shareText.value = 'garbage'; document.getElementById('shareImportButton').click()")
        check("an invalid import is reported in the window", page.eval("shareDialog.open && document.getElementById('shareMessage').className === 'error'"))
        page.eval("shareText.value = '[1, 2]'; document.getElementById('shareImportButton').click()")
        check("a list is no sketch", page.eval("shareDialog.open") and blocks() == 3)
        check("copying works without the clipboard API (http)", page.eval("copyTextFallback('abc')") is not None)
        page.key("Escape", "Escape", 27)
        page.wait("!shareDialog.open")
        check("escape closes the share window", True)

        # lua panel
        page.eval("document.getElementById('luaButton').click()")
        page.wait("document.getElementById('luaCode').textContent.includes('function onStartup()')")
        check("the lua panel shows the code", True)
        page.wait("document.querySelector('#blocklyDiv svg.blocklySvg').getBoundingClientRect().width < 1000")
        check("the workspace gets smaller next to the lua panel", True)
        reload()
        check("the lua panel stays open after a reload", not page.eval("luaPanel.hidden"))

        # ctrl+s
        add_block({"type": "periodically", "x": 400, "y": 200})
        page.wait("isDirty()")
        page.key("s", "KeyS", 83, modifiers=2)
        page.wait("!isDirty() && !saving")
        check("ctrl+s saves", "periodically" in open(server.file("icompadre.json"), encoding="utf-8").read())

        # an event block twice: both get a warning, until one of them is deleted or disabled
        warned = "icompadreWorkspace.getBlocksByType('periodically').filter(function(b) { return b.hasIcon(Blockly.icons.IconType.WARNING); }).length"
        check("one Periodically block has no warning", page.eval(warned) == 0, page.eval(warned))
        add_block({"type": "periodically", "x": 400, "y": 400})
        page.wait(warned + " == 2")
        check("two Periodically blocks both get a warning", True)
        page.eval("icompadreWorkspace.getBlocksByType('periodically')[1].setDisabledReason(true, 'MANUALLY_DISABLED')")
        page.wait(warned + " == 0")
        check("a disabled second block doesn't count", True)
        page.eval("icompadreWorkspace.getBlocksByType('periodically')[1].setDisabledReason(false, 'MANUALLY_DISABLED')")
        page.wait(warned + " == 2")
        page.eval("icompadreWorkspace.getBlocksByType('periodically')[1].dispose()")
        page.wait(warned + " == 0")
        check("the warning is gone when the second block is deleted", True)
        changes = page.eval("new Promise(function(resolve) { var n = 0; var count = function(e) { if (!e.isUiEvent) n++; };"
                            " icompadreWorkspace.addChangeListener(count);"
                            " setTimeout(function() { icompadreWorkspace.removeChangeListener(count); resolve(n); }, 1500); })")
        check("the warnings cause no further changes", changes == 0, changes)

        problems = page.problems(ignore=("Saving failed",))  # the failed saves above are logged on purpose
        check("no console problems", not problems, problems)

        # phone width and dark mode
        page.call("Emulation.setDeviceMetricsOverride", width=400, height=800, deviceScaleFactor=1, mobile=True)
        page.wait("document.documentElement.scrollWidth <= 400")
        check("no horizontal scrolling on a phone", True)
        page.call("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
        page.call("Emulation.setEmulatedMedia", features=[{"name": "prefers-color-scheme", "value": "dark"}])
        page.wait("icompadreWorkspace.getTheme().name == 'icompadre-dark'")
        check("the workspace follows the dark mode", True)
        page.call("Emulation.setEmulatedMedia", features=[])

        # another language: the loader passes it on, the texts of blockly and of the studio are translated
        open_studio(page, server, "/?lang=de")
        check("the loader passes the language on", page.eval("location.search") == "?lang=de")
        check("the page has the language", page.eval("document.documentElement.lang") == "de")
        check("the blockly texts are translated", page.eval("Blockly.Msg.ADD_COMMENT") == "Kommentar hinzufügen")
        label = page.eval("new Blockly.Workspace().newBlock('onstartup').toString()")
        check("the studio texts are translated", label.startswith("Beim Start"), label)
        check("the toolbox is translated", '"Programm"' in page.eval("JSON.stringify(toolbox)"))
        problems = page.problems(ignore=("Saving failed",))
        check("no console problems in another language", not problems, problems)

        # the loader shows an error instead of waiting forever
        icon = server.file(os.path.join("studio", "img", "code.svg"))
        os.rename(icon, icon + ".off")
        page.call("Page.navigate", url=server.url + "/")
        page.wait("document.getElementById('loadingError') !== null", 30)
        check("the loader names the missing file", "code.svg" in page.eval("document.getElementById('loadingError').textContent"))
        check("the loader doesn't open the studio", page.eval("location.pathname") == "/")
        os.rename(icon + ".off", icon)
    except Exception as e:
        check("unexpected error: %s" % e, False)
    finally:
        browser.close()
        server.close()

    return checks.done()


if __name__ == "__main__":
    sys.exit(main())

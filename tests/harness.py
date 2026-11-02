"""Test harness: serves a copy of sdcard/ like iCOMpadre does and drives a headless browser.

Only the python standard library is used here. The browser is controlled with the Chrome DevTools Protocol,
so any Chromium based browser works (Chrome, Chromium, Edge). Set STUDIO_BROWSER to its path if it is not found.
"""
import base64
import functools
import http.server
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request

RUNTIME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sdcard")

BROWSERS = [
    os.environ.get("STUDIO_BROWSER", ""),
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


# ---------------------------------------------------------------- checks

class Checks:
    """Collects the results of a test script and prints them"""

    def __init__(self):
        self.failed = []
        self.count = 0

    def check(self, name, ok, detail=""):
        self.count += 1
        print(("PASS " if ok else "FAIL ") + name + ("" if ok or detail == "" else "  -> " + str(detail)[:300]))
        if not ok:
            self.failed.append(name)
        return ok

    def done(self):
        print("\n%d/%d passed" % (self.count - len(self.failed), self.count))
        return 1 if self.failed else 0


# ---------------------------------------------------------------- web server

class StudioRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the files and accepts PUT for .lua and .json files, like iCOMpadre in program mode"""

    def do_PUT(self):
        name = os.path.basename(self.path)
        if not name.endswith((".lua", ".json")):
            self.send_error(403, "Only .lua and .json files can be uploaded")
            return
        length = int(self.headers["Content-Length"])
        with open(os.path.join(self.directory, name), "wb") as f:
            f.write(self.rfile.read(length))
        self.send_response(201, "Created")
        self.end_headers()

    def log_message(self, *args):
        pass


class Server:
    """A copy of sdcard/ in a temporary directory, served on a free port"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="studio-test-")
        shutil.copytree(RUNTIME, self.dir, dirs_exist_ok=True)
        for name in ("main.lua", "icompadre.json"):
            if os.path.exists(os.path.join(self.dir, name)):
                os.remove(os.path.join(self.dir, name))
        handler = functools.partial(StudioRequestHandler, directory=self.dir)
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.url = "http://localhost:%d" % self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def file(self, name):
        return os.path.join(self.dir, name)

    def close(self):
        self.httpd.shutdown()
        shutil.rmtree(self.dir, ignore_errors=True)


# ---------------------------------------------------------------- browser

class Page:
    """Minimal Chrome DevTools Protocol client for one page (websocket from the standard library)"""

    def __init__(self, ws_url):
        host, rest = ws_url[len("ws://"):].split("/", 1)
        h, p = host.split(":")
        self.sock = socket.create_connection((h, int(p)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.send(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (rest, host, key)).encode())
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.sock.recv(1)
        self.buf = b""
        self.id = 0
        self.events = []

    def _send(self, text):
        data = text.encode()
        header = bytearray([0x81])
        n = len(data)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        mask = os.urandom(4)
        header += mask
        self.sock.sendall(bytes(header) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise EOFError("browser closed the connection")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def _recv(self):
        message = b""
        while True:
            b0, b1 = self._read(2)
            n = b1 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            message += self._read(n)
            if b0 & 0x80:
                return json.loads(message)

    def call(self, method, **params):
        self.id += 1
        my_id = self.id
        self._send(json.dumps({"id": my_id, "method": method, "params": params}))
        while True:
            m = self._recv()
            if m.get("id") == my_id:
                if "error" in m:
                    raise RuntimeError(m["error"])
                return m.get("result", {})
            self.events.append(m)

    def eval(self, expression):
        """Evaluates javascript in the page and returns its value (awaits promises)"""
        r = self.call("Runtime.evaluate", expression=expression, awaitPromise=True, returnByValue=True)
        if "exceptionDetails" in r:
            details = r["exceptionDetails"]
            raise RuntimeError(details.get("exception", {}).get("description") or details)
        return r["result"].get("value")

    def wait(self, expression, timeout=20):
        """Waits until the javascript expression is true"""
        end = time.time() + timeout
        while time.time() < end:
            try:
                if self.eval(expression):
                    return True
            except RuntimeError:
                pass
            time.sleep(0.1)
        raise TimeoutError(expression)

    def screenshot(self, path, clip=None):
        params = {"format": "png"}
        if clip:
            params["clip"] = clip
        with open(path, "wb") as f:
            f.write(base64.b64decode(self.call("Page.captureScreenshot", **params)["data"]))

    def problems(self, ignore=()):
        """Console errors/warnings and uncaught exceptions of the studio. Messages of browser extensions are ignored."""
        out = []
        for e in self.events:
            if e.get("method") == "Runtime.exceptionThrown":
                text = json.dumps(e["params"]["exceptionDetails"])
            elif e.get("method") == "Runtime.consoleAPICalled" and e["params"]["type"] in ("error", "warning"):
                text = " ".join(str(a.get("value", a.get("description"))) for a in e["params"]["args"])
            else:
                continue
            if "chrome-extension://" in text or any(i in text for i in ignore):
                continue
            out.append(text[:300])
        return out

    def key(self, key, code, keycode, modifiers=0):
        for kind in ("keyDown", "keyUp"):
            self.call("Input.dispatchKeyEvent", type=kind, key=key, code=code, windowsVirtualKeyCode=keycode, modifiers=modifiers)


class Browser:
    """A headless browser with a fresh profile"""

    def __init__(self, width=1280, height=800):
        path = next((b for b in BROWSERS if b and os.path.exists(b)), None)
        if path is None:
            sys.exit("No Chromium based browser found, set STUDIO_BROWSER to its path")
        self.profile = tempfile.mkdtemp(prefix="studio-browser-")
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        args = [path, "--headless=new", "--remote-debugging-port=%d" % port, "--user-data-dir=" + self.profile,
                "--no-first-run", "--disable-gpu", "--disable-extensions",
                "--lang=en-US", "--accept-lang=en-US",   # the studio follows the browser language, the tests expect english
                "about:blank"]
        if sys.platform.startswith("linux"):
            args.insert(1, "--no-sandbox")
        self.proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                targets = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json/list" % port))
                pages = [t for t in targets if t["type"] == "page"]
                if pages:
                    self.page = Page(pages[0]["webSocketDebuggerUrl"])
                    break
            except Exception:
                pass
            time.sleep(0.2)
        else:
            self.proc.kill()
            sys.exit("The browser did not start: " + path)
        self.page.call("Runtime.enable")
        self.page.call("Page.enable")
        self.page.call("Network.enable")
        self.page.call("Network.setCacheDisabled", cacheDisabled=True)
        self.page.call("Emulation.setDeviceMetricsOverride", width=width, height=height, deviceScaleFactor=1, mobile=False)

    def close(self):
        self.proc.kill()
        self.proc.wait()
        shutil.rmtree(self.profile, ignore_errors=True)


STUDIO_READY = "typeof savedSketch !== 'undefined' && savedSketch !== null"


def open_studio(page, server, path="/studio/index.html"):
    """Opens the studio and waits until the sketch of the device is loaded"""
    page.call("Page.navigate", url=server.url + path)
    page.wait(STUDIO_READY, 60)


# Javascript which generates the lua code of every block of the toolbox, each one alone in a workspace (inputs empty):
#   blocks:  {blocktype: {"code": code of the block, "uses": [names of the helper functions]}}
#   helpers: {name: code of the helper function}
#   full:    {blocktype: complete lua program of the block, as it is stored as main.lua}
#   program: one program with all blocks: every statement block inside of OnStartup, every value block printed
GENERATE_ALL = r"""
(function() {
  var entries = [];
  (function walk(items) {
    items.forEach(function(item) {
      if (item.kind && item.kind.toLowerCase() === 'block') entries.push(item);
      if (item.contents) walk(item.contents);
    });
  })(toolbox.contents);

  function state(entry) {
    var s = Object.assign({}, entry);
    delete s.kind;
    return s;
  }

  var out = {'blocks': {}, 'helpers': {}, 'full': {}, 'program': null};
  entries.forEach(function(entry) {
    var ws = new Blockly.Workspace();
    try {
      Blockly.serialization.blocks.append(state(entry), ws);
      out.full[entry.type] = Blockly.Lua.workspaceToCode(ws);

      Blockly.Lua.init(ws);
      var code = Blockly.Lua.blockToCode(ws.getTopBlocks(false)[0]);
      var definitions = Blockly.Lua.definitions_;
      var uses = Object.keys(definitions).sort();
      uses.forEach(function(name) { out.helpers[name] = definitions[name]; });
      out.blocks[entry.type] = {'code': Array.isArray(code) ? code[0] : code, 'uses': uses};
    } catch (e) {
      out.blocks[entry.type] = {'code': 'ERROR: ' + e.message, 'uses': []};
    }
    ws.dispose();
  });

  var ws = new Blockly.Workspace();
  try {
    var children = [];
    entries.forEach(function(entry) {
      var probe = new Blockly.Workspace();
      var block = probe.newBlock(entry.type);
      var kind = block.outputConnection ? 'value' : (block.previousConnection && block.nextConnection ? 'statement' : 'top');
      probe.dispose();
      if (kind === 'value') children.push({'type': 'text_print', 'inputs': {'TEXT': {'block': state(entry)}}});
      else if (kind === 'statement') children.push(state(entry));
    });
    var chain = null;
    for (var i = children.length - 1; i >= 0; i--) {
      if (chain) children[i].next = {'block': chain};
      chain = children[i];
    }
    Blockly.serialization.blocks.append({'type': 'onstartup', 'inputs': {'actions': {'block': chain}}}, ws);
    out.program = Blockly.Lua.workspaceToCode(ws);
  } catch (e) {
    out.program = 'ERROR: ' + e.message;
  }
  ws.dispose();
  return JSON.stringify(out);
})()
"""


def generate_all(page):
    """The lua code of every toolbox block, see GENERATE_ALL"""
    return json.loads(page.eval(GENERATE_ALL))

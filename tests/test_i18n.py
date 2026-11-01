"""Checks the texts of the studio and their translations, without a browser.

msg/en.js is the master. The other languages (msg/<language>.js) may lack texts (they are shown in english then),
but must not have texts which english doesn't have, and must keep the placeholders of every text:
%1, %2, ... (the inputs of a block) exactly, {name} (filled in by the code) may be left out.
The block files which are already translated must not contain texts of their own, only references to Blockly.Msg.
The texts of the radio descriptions (radio/*.js) stay english, their translations are looked up by the english text (ICOM_TERM_...).
"""
import glob
import json
import os
import re
import sys

from harness import RUNTIME, Checks

STUDIO = os.path.join(RUNTIME, "studio")
MSG = os.path.join(STUDIO, "msg")

# files whose texts all come from msg/*.js. Add a file here when its texts are moved there
TRANSLATED_FILES = ["studio.js", "base.js", "radio/icom.js"]

# the pages which choose the language with studioLanguage([...])
LANGUAGE_PAGES = [os.path.join(RUNTIME, "index.html"), os.path.join(STUDIO, "index.html")]

# texts in a block definition: appendField("..."), setTooltip("..."), "message0": "...", "tooltip": "...", group("..."
# A text is anything with a letter, so "-" or "%1 %2" are fine
HARDCODED = re.compile(r'''(appendField|setTooltip|group)\(\s*"([^"]*[A-Za-z][^"]*)"|"(message\d+|tooltip)"\s*:\s*"([^"]*[A-Za-z][^"]*)"''')
# warnings: checkRange(..., "text") and setWarningText("text"). Texts have a letter and a space, keys of msg/*.js don't
WARNING = re.compile(r'''checkRange\(|setWarningText\(''')
LITERAL = re.compile(r'"(?:[^"\\]|\\.)*"')


def hardcoded(line):
    """True if the line of a block file contains a text instead of a reference to msg/*.js"""
    if HARDCODED.search(line):
        return True
    return bool(WARNING.search(line)) and any(re.search(r"[A-Za-z].* |\s.*[A-Za-z]", literal) for literal in LITERAL.findall(line))

MESSAGE_KEY = re.compile(r'''Blockly\.Msg\.(\w+)|"((?:ICP|ICOM|STUDIO)_\w+)"''')


def read_messages(path):
    """The texts of a msg file: {key: text}"""
    messages = {}
    for number, line in enumerate(open(path, encoding="utf-8"), 1):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        match = re.fullmatch(r'Blockly\.Msg\.(\w+) = ("(?:[^"\\]|\\.)*");', line)
        if not match:
            raise ValueError("%s:%d: expected Blockly.Msg.KEY = \"text\";" % (os.path.basename(path), number))
        if match.group(1) in messages:
            raise ValueError("%s:%d: %s is defined twice" % (os.path.basename(path), number, match.group(1)))
        messages[match.group(1)] = json.loads(match.group(2))
    return messages


def inputs(text):
    return sorted(re.findall(r"%\d+", text))


def names(text):
    return set(re.findall(r"\{(\w+)\}", text))


def term_key(text):
    """The key of a text of a radio description, the same as termKey() in radio/icom.js"""
    return "ICOM_TERM_" + re.sub(r"[^A-Za-z0-9]+", "_", text.replace("Δ", " delta ")).strip("_")


def main():
    checks = Checks()
    check = checks.check

    languages = {os.path.basename(path)[:-3]: read_messages(path) for path in sorted(glob.glob(os.path.join(MSG, "*.js")))}
    english = languages["en"]

    # the translations
    for language, messages in sorted(languages.items()):
        if language == "en":
            continue
        unknown = sorted(set(messages) - set(english))
        check("%s: no texts which english doesn't have" % language, not unknown, unknown)
        wrong = [key for key in messages if key in english and inputs(messages[key]) != inputs(english[key])]
        check("%s: the same inputs (%%1, %%2, ...) as english" % language, not wrong, wrong)
        wrong = [key for key in messages if key in english and not names(messages[key]) <= names(english[key])]
        check("%s: only placeholders {...} which english has" % language, not wrong, wrong)
        check("%s: the blockly texts are there" % language, os.path.exists(os.path.join(STUDIO, "blockly", language + ".js")))
        missing = sorted(set(english) - set(messages))
        print("     %s: %d of %d texts translated%s" % (language, len(english) - len(missing), len(english),
                                                       (", missing: " + ", ".join(missing)) if missing else ""))

    # the pages offer exactly the languages there are
    for page in LANGUAGE_PAGES:
        offered = re.findall(r"studioLanguage\(\[([^\]]*)\]\)", open(page, encoding="utf-8").read())
        offered = [sorted(json.loads("[" + entry.replace("'", '"') + "]")) for entry in offered]
        name = os.path.relpath(page, RUNTIME).replace(os.sep, "/")
        check("%s offers the languages of msg/" % name, offered == [sorted(languages)], offered)

    # every text which is used exists, and every text is used
    sources = {os.path.relpath(path, STUDIO).replace(os.sep, "/"): open(path, encoding="utf-8").read()
               for path in glob.glob(os.path.join(STUDIO, "*.js")) + glob.glob(os.path.join(STUDIO, "radio", "*.js"))}
    sources["index.html"] = open(os.path.join(STUDIO, "index.html"), encoding="utf-8").read()
    used = set()
    for name, source in sources.items():
        used.update(key for match in MESSAGE_KEY.finditer(source) for key in match.groups()
                    if key and key.startswith(("ICP_", "ICOM_", "STUDIO_")) and not key.startswith("ICOM_TERM_"))
    check("every text used in the studio is in msg/en.js", not sorted(used - set(english)), sorted(used - set(english)))

    # the texts of the radio descriptions: the key belongs to the english text, and the text is in a description
    terms = {key: text for key, text in english.items() if key.startswith("ICOM_TERM_")}
    wrong = sorted(key for key, text in terms.items() if term_key(text) != key)
    check("the keys ICOM_TERM_... are made from their english text", not wrong, wrong)
    described = set()
    for name, source in sources.items():
        if name.startswith("radio/"):
            described.update(term_key(json.loads(literal)) for literal in re.findall(r'"(?:[^"\\]|\\.)*"', source))
    unused = sorted(set(terms) - described)
    check("every ICOM_TERM_... text is in a radio description (otherwise it was changed there)", not unused, unused)

    unused = sorted(set(english) - used - set(terms))
    check("every text in msg/en.js is used", not unused, unused)

    # translated files have no texts of their own
    for name in TRANSLATED_FILES:
        found = ["%d: %s" % (number, line.strip())
                 for number, line in enumerate(sources[name].splitlines(), 1)
                 if not line.strip().startswith(("//", "*"))   # examples in comments are fine
                 and hardcoded(line)]
        check("%s has no texts of its own (they belong into msg/en.js)" % name, not found, found)

    return checks.done()


if __name__ == "__main__":
    sys.exit(main())

"""Compares the lua code of every toolbox block with tests/expected_lua.json.

Every change of the generated code shows up here: a new block, a changed block or a changed helper function.
If the change is intended, update the expected code and review the diff before committing it:

    python tests/test_generated_code.py --update
"""
import difflib
import json
import os
import sys

from harness import Browser, Checks, Server, generate_all, open_studio

EXPECTED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expected_lua.json")


def main():
    update = "--update" in sys.argv
    checks = Checks()
    server, browser = Server(), Browser()
    try:
        open_studio(browser.page, server)
        generated = generate_all(browser.page)
        problems = browser.page.problems()
    finally:
        browser.close()
        server.close()

    actual = {"blocks": generated["blocks"], "helpers": generated["helpers"]}
    errors = {k: v["code"] for k, v in actual["blocks"].items() if v["code"].startswith("ERROR")}
    checks.check("every block generates code (%d blocks)" % len(actual["blocks"]), not errors, errors)
    checks.check("a program with all blocks generates code", not generated["program"].startswith("ERROR"), generated["program"][:300])
    checks.check("no console problems while generating", not problems, problems)

    if update:
        with open(EXPECTED, "w", encoding="utf-8", newline="\n") as f:
            json.dump(actual, f, indent=1, sort_keys=True, ensure_ascii=False)
            f.write("\n")
        print("\nwritten", EXPECTED)
        return checks.done()

    with open(EXPECTED, encoding="utf-8") as f:
        expected = json.load(f)

    for part in ("blocks", "helpers"):
        added = sorted(set(actual[part]) - set(expected[part]))
        removed = sorted(set(expected[part]) - set(actual[part]))
        changed = sorted(k for k in set(actual[part]) & set(expected[part]) if actual[part][k] != expected[part][k])
        checks.check("no new %s" % part, not added, added)
        checks.check("no removed %s" % part, not removed, removed)
        checks.check("no changed %s" % part, not changed, changed)
        for name in changed:
            a, e = actual[part][name], expected[part][name]
            if part == "blocks":
                a, e = a["code"] + "\nuses: " + ", ".join(a["uses"]), e["code"] + "\nuses: " + ", ".join(e["uses"])
            print("\n".join(difflib.unified_diff(e.splitlines(), a.splitlines(), "expected " + name, "actual " + name, lineterm="")))

    if checks.failed:
        print("\nIf the changes are intended: python tests/test_generated_code.py --update")
    return checks.done()


if __name__ == "__main__":
    sys.exit(main())

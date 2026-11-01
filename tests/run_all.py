"""Runs all tests of the studio, see tests/README.md. Exits with 1 if one of them failed."""
import os
import subprocess
import sys

TESTS = ["test_i18n.py", "test_generated_code.py", "test_lua.py", "test_ui.py"]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    failed = []
    for test in TESTS:
        print("=" * 70 + "\n" + test + "\n" + "=" * 70, flush=True)
        if subprocess.call([sys.executable, os.path.join(here, test)], cwd=here) != 0:
            failed.append(test)
        print(flush=True)
    print("failed: " + ", ".join(failed) if failed else "all tests passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

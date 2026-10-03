#!/usr/bin/env python3
"""Stamp index.html's local CSS/JS links with a fresh ?v= version.

GitHub Pages serves every file with Cache-Control: max-age=600, so after a deploy a
browser can pair the new index.html with a stale lab.js for up to ten minutes. A new
?v= on every asset makes the page always load the files it was published with.

    python3 tools/stamp_assets.py     # run before committing any UI / data change
"""
import pathlib
import re
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCAL = r'(?!https?:)(?:\./)?[\w./-]+\.(?:css|js)'


def main():
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf8")
    stamp = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    new, n = re.subn(rf'((?:href|src)="{LOCAL})(?:\?v=\w+)?"', rf'\1?v={stamp}"', html)
    path.write_text(new, encoding="utf8")
    print(f"index.html: {n} assets stamped v={stamp}")


if __name__ == "__main__":
    main()

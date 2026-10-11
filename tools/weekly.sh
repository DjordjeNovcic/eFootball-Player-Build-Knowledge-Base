#!/usr/bin/env bash
# The weekly refresh, in one go — run it from anywhere, once a week:
#
#     tools/weekly.sh             # new public cards → builds → managers → the week's new cards → commit + push
#     tools/weekly.sh --no-push   # same, but leave the commit for you to push
#
# Only data/public and data/managers.js change; your squad (data/players.js, USER-SQUAD.md)
# is never touched. A full first crawl takes ~85 min (one eFHUB page every 5 s); a weekly
# run fetches only the cards that are new since last time, usually a few minutes.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/4 new public cards from eFHUB's sitemap"
python3 tools/fetch_public.py
echo
echo "== 2/4 managers"
python3 tools/fetch_players.py --managers
echo
echo "== 3/4 Recommended by AI builds for every public card"
node tools/build_public.js
echo
echo "== 4/4 the week's new cards"
node tools/new_cards.js 7
echo

git add data/public data/managers.js
if git diff --cached --quiet; then
  echo "Nothing changed this week — nothing to commit."
  exit 0
fi
git commit -q -m "Public cards: weekly refresh ($(date +%Y-%m-%d))"
if [[ "${1:-}" == "--no-push" ]]; then
  echo "Committed. Push when ready: git push"
else
  git push
  echo "Pushed — GitHub Pages picks it up in a few minutes."
fi

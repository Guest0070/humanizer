#!/bin/sh
# Opens Plainspoken as a standalone app window on macOS or Linux. No server, no install, no network.
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/index.html"
for b in google-chrome chromium chromium-browser microsoft-edge brave-browser; do
  if command -v "$b" >/dev/null 2>&1; then exec "$b" --app="$URL"; fi
done
if [ -d "/Applications/Google Chrome.app" ]; then exec open -na "Google Chrome" --args --app="$URL"; fi
if command -v xdg-open >/dev/null 2>&1; then exec xdg-open "$URL"; fi
exec open "$URL"

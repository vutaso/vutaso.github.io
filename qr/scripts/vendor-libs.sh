#!/usr/bin/env bash
# Re-download pinned vendor assets into assets/vendor/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/assets/vendor"
mkdir -p "$VENDOR"

curl -fsSL -o "$VENDOR/qr-code-styling.js" \
  "https://unpkg.com/qr-code-styling@1.6.2/lib/qr-code-styling.js"
curl -fsSL -o "$VENDOR/jspdf.umd.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
curl -fsSL -o "$VENDOR/jszip.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
curl -fsSL -o "$VENDOR/FileSaver.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"
curl -fsSL -o "$VENDOR/pickr.min.js" \
  "https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/pickr.min.js"
curl -fsSL -o "$VENDOR/pickr.nano.min.css" \
  "https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/themes/nano.min.css"

echo "Vendor libraries updated in $VENDOR"

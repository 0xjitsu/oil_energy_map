#!/bin/bash
# ─────────────────────────────────────────────────
# Gas Station Data Pipeline
# ─────────────────────────────────────────────────
# Downloads and processes Philippine gas station data.
#
# Primary source: OpenStreetMap via Overpass API (free, ODbL licensed)
# Supplementary: Firecrawl for brand-specific enrichment (requires API key)
#
# Usage:
#   ./scripts/scrape-stations.sh          # Full pipeline (download + process)
#   ./scripts/scrape-stations.sh --skip-download  # Re-process existing data
#
# Output: src/data/stations/<brand>.json (7 files + _meta.json)
# ─────────────────────────────────────────────────

set -euo pipefail
cd "$(dirname "$0")/.."

RAW_FILE="scripts/osm-stations-raw.json"

# ── Step 1: Download from Overpass API ──────────
if [[ "${1:-}" != "--skip-download" ]]; then
  echo "⟐ Downloading PH fuel stations from OpenStreetMap..."
  curl -s 'https://overpass-api.de/api/interpreter' \
    --data-urlencode 'data=[out:json][timeout:120];area["ISO3166-1"="PH"]->.ph;(node["amenity"="fuel"](area.ph);way["amenity"="fuel"](area.ph););out center tags;' \
    -o "$RAW_FILE"
  echo "  ✓ Downloaded $(python3 -c "import json; print(len(json.load(open('$RAW_FILE'))['elements']))" ) elements"
else
  echo "⟐ Skipping download, using existing $RAW_FILE"
fi

# ── Step 2: Process into per-brand JSON ─────────
echo "⟐ Processing into per-brand JSON files..."
python3 scripts/process-osm-stations.py

echo ""
echo "⟐ Done! Station data ready at src/data/stations/"
echo ""
echo "  Brand files: petron.json, shell.json, caltex.json, phoenix.json, seaoil.json, unioil.json, others.json"
echo "  Metadata:    _meta.json"
echo ""
echo "  To enrich with Firecrawl (optional):"
echo "    export FIRECRAWL_API_KEY=\$(security find-generic-password -s 'firecrawl-api-key' -w)"
echo "    firecrawl scrape 'https://www.petron.com/station-locator/'"

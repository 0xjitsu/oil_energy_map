#!/usr/bin/env python3
"""
Process OpenStreetMap fuel station data into per-brand JSON files.

Input:  scripts/osm-stations-raw.json (from Overpass API)
Output: src/data/stations/<brand>.json

Usage:
  python3 scripts/process-osm-stations.py

Data source: OpenStreetMap via Overpass API
License: ODbL (https://opendatacommons.org/licenses/odbl/)
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE = SCRIPT_DIR / "osm-stations-raw.json"
OUTPUT_DIR = PROJECT_ROOT / "src" / "data" / "stations"

# Brand normalization: map OSM brand tags to canonical names
BRAND_MAP = {
    "petron": "Petron",
    "shell": "Shell",
    "pilipinas shell": "Shell",
    "shell v-power": "Shell",
    "caltex": "Caltex",
    "chevron": "Caltex",
    "phoenix": "Phoenix",
    "phoenix petroleum": "Phoenix",
    "phoenix fuels": "Phoenix",
    "seaoil": "SeaOil",
    "sea oil": "SeaOil",
    "flying v": "FlyingV",
    "total": "Total",
    "totalenergies": "Total",
    "total energies": "Total",
    "jetti": "Jetti",
    "jetti petroleum": "Jetti",
    "ptt": "PTT",
    "ptt philippines": "PTT",
    "unioil": "Unioil",
    "petro gazz": "PetroGazz",
    "cleanfuel": "Cleanfuel",
    "clean fuel": "Cleanfuel",
    "rephil": "Rephil",
    "re-phil": "Rephil",
    "filoil": "Other",
    "star oil": "Other",
    "eco oil": "Other",
    "ecoil": "Other",
    "uno fuel": "Other",
}

# File grouping: which brands get their own file vs grouped into "others"
MAJOR_BRANDS = {"Petron", "Shell", "Caltex", "Phoenix", "SeaOil", "Unioil"}
MINOR_BRANDS_FILE = {
    "FlyingV", "Total", "Jetti", "PTT", "PetroGazz", "Cleanfuel", "Rephil", "Other"
}


def normalize_brand(tags: dict) -> str:
    """Normalize OSM brand tag to canonical brand name."""
    brand = tags.get("brand", "").strip()
    operator = tags.get("operator", "").strip()
    name = tags.get("name", "").strip()

    # Try brand tag first, then operator, then name
    for candidate in [brand, operator, name]:
        key = candidate.lower().strip()
        if key in BRAND_MAP:
            return BRAND_MAP[key]
        # Partial matching for common patterns
        for pattern, canonical in BRAND_MAP.items():
            if pattern in key:
                return canonical

    return "Other"


def slugify(text: str) -> str:
    """Create a URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text[:60]


def get_coordinates(element: dict) -> tuple[float, float] | None:
    """Extract lat/lon from OSM element (node or way with center)."""
    if element["type"] == "node":
        return (element.get("lat"), element.get("lon"))
    elif element["type"] == "way" and "center" in element:
        return (element["center"]["lat"], element["center"]["lon"])
    return None


def process_stations():
    """Main processing pipeline."""
    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE) as f:
        data = json.load(f)

    elements = data["elements"]
    print(f"Processing {len(elements)} elements...")

    now = datetime.now(timezone.utc).isoformat()
    stations_by_brand: dict[str, list] = defaultdict(list)
    skipped = 0

    for el in elements:
        coords = get_coordinates(el)
        if not coords or coords[0] is None:
            skipped += 1
            continue

        lat, lon = coords
        tags = el.get("tags", {})
        brand = normalize_brand(tags)
        name = tags.get("name", f"{brand} Station")
        address = tags.get("addr:full", "") or tags.get("addr:street", "") or ""
        city = tags.get("addr:city", "")
        if city and address:
            address = f"{address}, {city}"
        elif city:
            address = city

        osm_id = f"{el['type']}/{el['id']}"
        station_id = f"{slugify(brand)}-{el['id']}"

        fuel_types = []
        if tags.get("fuel:diesel") == "yes":
            fuel_types.append("diesel")
        if tags.get("fuel:octane_91") == "yes" or tags.get("fuel:gasoline") == "yes":
            fuel_types.append("gasoline")
        if tags.get("fuel:octane_95") == "yes":
            fuel_types.append("premium")

        station = {
            "id": station_id,
            "brand": brand,
            "name": name,
            "coordinates": [round(lat, 6), round(lon, 6)],
            "address": address,
        }
        if fuel_types:
            station["fuelTypes"] = fuel_types
        station["source"] = {
            "url": f"https://www.openstreetmap.org/{osm_id}",
            "scrapedAt": now,
        }

        stations_by_brand[brand].append(station)

    # Write per-brand files
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Major brands get their own file
    for brand in MAJOR_BRANDS:
        stations = stations_by_brand.get(brand, [])
        filename = slugify(brand) + ".json"
        filepath = OUTPUT_DIR / filename
        with open(filepath, "w") as f:
            json.dump(stations, f, indent=2)
        print(f"  {brand}: {len(stations)} stations → {filename}")

    # Minor brands grouped into "others.json"
    others = []
    for brand, stations in stations_by_brand.items():
        if brand not in MAJOR_BRANDS:
            others.extend(stations)
    with open(OUTPUT_DIR / "others.json", "w") as f:
        json.dump(others, f, indent=2)
    print(f"  Others: {len(others)} stations → others.json")

    total = sum(len(s) for s in stations_by_brand.values())
    print(f"\nTotal: {total} stations processed, {skipped} skipped (no coords)")
    print(f"Output: {OUTPUT_DIR}")

    # Write metadata
    meta = {
        "source": "OpenStreetMap via Overpass API",
        "license": "ODbL (https://opendatacommons.org/licenses/odbl/)",
        "query": '[out:json];area["ISO3166-1"="PH"]->.ph;(node["amenity"="fuel"](area.ph);way["amenity"="fuel"](area.ph););out center tags;',
        "processedAt": now,
        "totalStations": total,
        "brandBreakdown": {
            brand: len(stations) for brand, stations in sorted(
                stations_by_brand.items(), key=lambda x: -len(x[1])
            )
        },
    }
    with open(OUTPUT_DIR / "_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\nMetadata written to _meta.json")


if __name__ == "__main__":
    process_stations()

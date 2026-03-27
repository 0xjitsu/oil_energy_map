#!/usr/bin/env python3
"""
One-time enrichment script: assigns a `region` field to each gas station
based on its coordinates using Philippine region bounding boxes.
"""

import json
import os
from pathlib import Path

# Region bounding boxes — ordered from most specific to least specific
# NCR and CAR are checked first since they overlap with larger regions
REGIONS = [
    {"name": "NCR (Metro Manila)", "latMin": 14.35, "latMax": 14.78, "lngMin": 120.90, "lngMax": 121.15},
    {"name": "CAR (Cordillera)", "latMin": 16.5, "latMax": 18.5, "lngMin": 120.5, "lngMax": 121.5},
    {"name": "Region I (Ilocos)", "latMin": 15.5, "latMax": 18.6, "lngMin": 119.5, "lngMax": 121.0},
    {"name": "Region II (Cagayan Valley)", "latMin": 15.5, "latMax": 18.7, "lngMin": 121.0, "lngMax": 122.5},
    {"name": "Region III (Central Luzon)", "latMin": 14.5, "latMax": 16.0, "lngMin": 119.5, "lngMax": 121.5},
    {"name": "Region IV-A (CALABARZON)", "latMin": 13.5, "latMax": 14.8, "lngMin": 120.5, "lngMax": 122.2},
    {"name": "Region IV-B (MIMAROPA)", "latMin": 8.5, "latMax": 13.5, "lngMin": 117.5, "lngMax": 122.5},
    {"name": "Region V (Bicol)", "latMin": 11.5, "latMax": 14.5, "lngMin": 122.5, "lngMax": 124.5},
    {"name": "Region VI (Western Visayas)", "latMin": 9.5, "latMax": 12.0, "lngMin": 121.5, "lngMax": 123.5},
    {"name": "Region VII (Central Visayas)", "latMin": 9.0, "latMax": 11.5, "lngMin": 123.0, "lngMax": 124.5},
    {"name": "Region VIII (Eastern Visayas)", "latMin": 9.5, "latMax": 12.5, "lngMin": 124.0, "lngMax": 126.0},
    {"name": "Region IX (Zamboanga Peninsula)", "latMin": 6.5, "latMax": 9.0, "lngMin": 121.5, "lngMax": 123.5},
    {"name": "Region X (Northern Mindanao)", "latMin": 7.5, "latMax": 9.5, "lngMin": 123.0, "lngMax": 125.5},
    {"name": "Region XI (Davao)", "latMin": 5.5, "latMax": 8.0, "lngMin": 125.0, "lngMax": 127.0},
    {"name": "Region XII (SOCCSKSARGEN)", "latMin": 5.5, "latMax": 7.5, "lngMin": 124.0, "lngMax": 126.0},
    {"name": "Region XIII (Caraga)", "latMin": 7.5, "latMax": 10.0, "lngMin": 125.0, "lngMax": 126.5},
    {"name": "BARMM", "latMin": 5.5, "latMax": 8.5, "lngMin": 119.5, "lngMax": 124.5},
]


def get_region(lat: float, lng: float) -> str:
    for r in REGIONS:
        if r["latMin"] <= lat <= r["latMax"] and r["lngMin"] <= lng <= r["lngMax"]:
            return r["name"]
    return "Unknown"


def main():
    stations_dir = Path(__file__).parent.parent / "src" / "data" / "stations"
    json_files = sorted(stations_dir.glob("*.json"))

    total = 0
    unknown = 0
    region_counts: dict[str, int] = {}

    for json_file in json_files:
        with open(json_file, "r") as f:
            stations = json.load(f)

        # Skip non-array files (e.g. _meta.json)
        if not isinstance(stations, list):
            print(f"  {json_file.name}: skipped (not an array)")
            continue

        for station in stations:
            lat, lng = station["coordinates"]
            region = get_region(lat, lng)
            station["region"] = region
            total += 1
            region_counts[region] = region_counts.get(region, 0) + 1
            if region == "Unknown":
                unknown += 1

        with open(json_file, "w") as f:
            json.dump(stations, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print(f"  {json_file.name}: {len(stations)} stations enriched")

    print(f"\nTotal: {total} stations")
    print(f"Unknown region: {unknown}")
    print("\nRegion distribution:")
    for region, count in sorted(region_counts.items(), key=lambda x: -x[1]):
        print(f"  {region}: {count}")


if __name__ == "__main__":
    main()

"""
Independent reference fixtures for the VYOMIRA engine regression tests.

Generated with pyswisseph (Swiss Ephemeris, Moshier analytical ephemeris — no data files) as an
*independent dev-time oracle only*. Swiss Ephemeris is NOT shipped with or linked into VYOMIRA
(it is AGPL / commercially licensed). Run:

    python -m venv .venv && .venv/bin/pip install pyswisseph
    .venv/bin/python scripts/reference/generate_se_fixtures.py > tests/fixtures/swisseph-lahiri.json
"""
import json
import swisseph as swe

CASES = [
    # id, UTC (y, m, d, hour-decimal), lat, lon, note
    ("j2000-greenwich", (2000, 1, 1, 12.0), 51.4779, 0.0, "J2000 epoch"),
    ("delhi-1947", (1947, 8, 14, 18.5), 28.6139, 77.2090, "Historical, IST"),
    ("mumbai-1900", (1900, 3, 15, 4.25), 19.0760, 72.8777, "Pre-standard-time era"),
    ("leap-2000-02-29", (2000, 2, 29, 23.75), 12.9716, 77.5946, "Leap day, Bengaluru"),
    ("leap-2024-02-29", (2024, 2, 29, 6.1), 13.0827, 80.2707, "Leap day, Chennai"),
    ("nyc-dst-2021-03-14", (2021, 3, 14, 7.5), 40.7128, -74.0060, "Just after US DST start"),
    ("london-dst-2019-10-27", (2019, 10, 27, 1.5), 51.5074, -0.1278, "UK fall-back ambiguous hour"),
    ("sydney-1985", (1985, 7, 4, 2.0), -33.8688, 151.2093, "Southern hemisphere"),
    ("buenos-aires-1972", (1972, 11, 20, 15.3), -34.6037, -58.3816, "Southern + western"),
    ("reykjavik-1990", (1990, 6, 21, 0.2), 64.1466, -21.9426, "High latitude"),
    ("tromso-2010", (2010, 12, 1, 9.0), 69.6492, 18.9553, "Above Arctic circle"),
    ("quito-2005", (2005, 9, 9, 18.0), -0.1807, -78.4678, "Equator"),
    ("honolulu-1963", (1963, 1, 31, 20.75), 21.3069, -157.8583, "Pacific"),
    ("auckland-2030", (2030, 4, 10, 22.0), -36.8485, 174.7633, "Future date"),
    ("kolkata-1975", (1975, 5, 5, 23.99), 22.5726, 88.3639, "Near day boundary"),
    ("tokyo-1868", (1868, 10, 23, 3.0), 35.6762, 139.6503, "19th century"),
]

PLANETS = [
    ("Sun", swe.SUN), ("Moon", swe.MOON), ("Mars", swe.MARS), ("Mercury", swe.MERCURY),
    ("Jupiter", swe.JUPITER), ("Venus", swe.VENUS), ("Saturn", swe.SATURN), ("Rahu", swe.MEAN_NODE),
]

swe.set_sid_mode(swe.SIDM_LAHIRI)
flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
out = {"generator": f"pyswisseph {swe.version} (Moshier), SIDM_LAHIRI, mean node", "cases": []}
for cid, (y, m, d, h), lat, lon, note in CASES:
    jd = swe.julday(y, m, d, h, swe.GREG_CAL if y > 1582 else swe.JUL_CAL)
    planets = {}
    for name, pid in PLANETS:
        xx, _ = swe.calc_ut(jd, pid, flags)
        planets[name] = {"lon": xx[0], "speed": xx[3]}
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b"W", swe.FLG_SIDEREAL)
    ayan = swe.get_ayanamsa_ex_ut(jd, swe.FLG_MOSEPH | swe.FLG_NONUT)[1]
    out["cases"].append({
        "id": cid, "note": note, "utc": [y, m, d, h], "lat": lat, "lon": lon,
        "jdUT": jd, "ayanamsa": ayan, "ascendant": ascmc[0], "planets": planets,
    })
print(json.dumps(out, indent=1))

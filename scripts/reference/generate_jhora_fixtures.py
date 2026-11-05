"""
Independent dev-time oracle for advanced Vedic features (PyJHora 4.x, AGPL — NOT shipped or linked;
used only to generate test fixtures) plus Swiss Ephemeris for true node / tropical / Placidus.

    .venv/bin/pip install PyJHora pyswisseph
    .venv/bin/python scripts/reference/generate_jhora_fixtures.py > tests/fixtures/jhora-reference.json
"""
import json, contextlib, io, sys
import swisseph as swe
from jhora.panchanga import drik
from jhora.horoscope.chart import charts, ashtakavarga, strength
from jhora import utils, const

drik.set_ayanamsa_mode("LAHIRI")
src = json.load(open("tests/fixtures/swisseph-lahiri.json"))
FACTORS = [2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]
NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
out = {"generator": "PyJHora + pyswisseph (Moshier), Lahiri", "cases": []}

def quiet(f, *a, **k):
    with contextlib.redirect_stdout(io.StringIO()):
        return f(*a, **k)

for c in src["cases"]:
    y, m, d, h = c["utc"]
    tz = round(c["lon"] / 15 * 2) / 2
    jd_ut = swe.julday(y, m, d, h)
    place = drik.Place("x", c["lat"], c["lon"], tz)
    jd_local = jd_ut + tz / 24.0
    case = {"id": c["id"], "utc": c["utc"], "lat": c["lat"], "lon": c["lon"], "tz": tz}
    vargas = {}
    if abs(c["lat"]) > 66:  # PyJHora's ascendant uses Placidus internally and fails above the polar circle
        print("skip", c["id"], file=sys.stderr); continue
    for f in FACTORS:
        # D2: method 2 = traditional Parashari hora (Leo/Cancer only); other vargas: method 1 (Parashari)
        pp = quiet(charts.divisional_chart, jd_local, place, divisional_chart_factor=f, chart_method=2 if f == 2 else 1)
        row = {}
        for p, (sign, _) in pp:
            row["Lagna" if p == const._ascendant_symbol else NAMES[p]] = sign
        vargas[f"D{f}"] = row
    case["vargas"] = vargas
    # Ashtakavarga from the D1 chart
    pp1 = quiet(charts.rasi_chart, jd_local, place)
    h_to_p = utils.get_house_planet_list_from_planet_positions(pp1)
    bav, sav, _ = ashtakavarga.get_ashtaka_varga(h_to_p)
    case["ashtakavarga"] = {"bav": bav[:7], "sav": sav}
    try:
        sb = quiet(strength.shad_bala, jd_local, place)
        case["shadbala"] = {"sthana": sb[0], "kaala": sb[1], "dig": sb[2], "cheshta": sb[3], "naisargika": sb[4], "drik": sb[5], "total": sb[6] if len(sb) > 6 else None, "rupa": sb[7] if len(sb) > 7 else None}
    except Exception as e:
        case["shadbala_error"] = str(e)
    # Swiss Ephemeris: true node (sidereal Lahiri), tropical apparent positions, Placidus cusps
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    tn, _ = swe.calc_ut(jd_ut, swe.TRUE_NODE, swe.FLG_MOSEPH | swe.FLG_SIDEREAL)
    case["trueNodeSidereal"] = tn[0]
    trop = {}
    for name, pid in [("Sun", swe.SUN), ("Moon", swe.MOON), ("Mars", swe.MARS), ("Mercury", swe.MERCURY), ("Jupiter", swe.JUPITER), ("Venus", swe.VENUS), ("Saturn", swe.SATURN)]:
        trop[name] = swe.calc_ut(jd_ut, pid, swe.FLG_MOSEPH)[0][0]
    case["tropical"] = trop
    if abs(c["lat"]) < 66:
        cusps, ascmc = swe.houses(jd_ut, c["lat"], c["lon"], b"P")
        case["placidus"] = {"cusps": list(cusps[:12]) if len(cusps) == 12 else list(cusps[1:13]), "asc": ascmc[0], "mc": ascmc[1]}
    out["cases"].append(case)
    print(c["id"], file=sys.stderr)
sys.stdout.write("\n" * 0); print(json.dumps(out, indent=1))

#!/usr/bin/env sh
# Copies PyJHora's precomputed North-Indian Ashtakoota table (AGPL; dev-only oracle, not committed)
# so tests/unit/compatibility.test.ts can cross-check Gana and Nadi for all 11,664 pairs.
#   .venv/bin/pip install PyJHora && sh scripts/reference/fetch_pyjhora_compat.sh .venv
VENV=${1:-.venv}
SRC=$("$VENV/bin/python" -c "import jhora,os;print(os.path.join(os.path.dirname(jhora.__file__),'horoscope','match','all_nak_pad_boy_girl.csv'))")
cp "$SRC" tests/fixtures/pyjhora-north-compat.csv && echo "copied $SRC"

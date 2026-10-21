"""Build data/cutoffs/MCC/2026/college-index.json: code -> city and MCC-listed address.

Run after scripts/build_mcc_seat_matrix.py (it reads the seat-matrix JSON it wrote).
The city comes from the ASMI institute-name lists; MCC data has no district field.
"""
import json, re

SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'
OUT = 'nextjs-sandbox/public/data/cutoffs/MCC/2026/college-index.json'

index = {}
for rd in ('round1', 'round2', 'round3', 'stray'):
    for x in json.load(open(f'{SEAT}/{rd}.json')):
        if x['code'] in index: continue
        address = re.sub(r'\s*\(\d{5,6}\)\s*$', '', x['institute']).strip()
        index[x['code']] = {'city': x['city'], 'address': address}

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(dict(sorted(index.items())), f, ensure_ascii=False, separators=(',', ':'))
print(len(index), 'colleges ->', OUT, '| without city:', sum(1 for v in index.values() if not v['city']))

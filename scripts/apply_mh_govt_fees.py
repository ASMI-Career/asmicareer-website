"""Apply the Maharashtra government MBBS fee structure to the MCC 2026 pages' data.

Usage: python3 scripts/apply_mh_govt_fees.py <fee_file.xlsx> [--dry-run]
  fee_file.xlsx: sheet "OPEN", columns Sr, Institute Name, Establishment, Fees
  (ASMI_CutoffData_MH_GOVT_MBBS_OPEN ...). One annual fee per Maharashtra government MBBS college.

It overwrites only the fee of those colleges, in
  * nextjs-sandbox/public/data/cutoffs/MCC/2026/GOVT_MBBS/*.json  ("fees", every category file and all.json)
  * nextjs-sandbox/public/data/seat-matrix/MCC/2026/*.json         ("fee" of the non-NRI MBBS rows)
Run it after scripts/build_mcc_seat_matrix.py (which re-reads the older ASMI fee list) so the new fees stick.
The Maharashtra state counselling data (data/cutoffs/MH) is not touched.
"""
import json, re, sys, glob
import openpyxl

SRC = sys.argv[1]
DRY = '--dry-run' in sys.argv
CUT = 'nextjs-sandbox/public/data/cutoffs/MCC/2026/GOVT_MBBS'
SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'

norm = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
digits = lambda s: int(re.sub(r'\D', '', str(s)))

# MCC college code -> name used in the fee file, where the two lists spell the college differently
ALIAS = {
    '902828': 'Government Medical College, Mumbai & GT Hospital',
    '200221': 'Lokmanya Tilak Medical College, Mumbai',
    '200205': 'B.J. Government Medical College, Pune',
    '200230': 'Topiwala Nair Medical College, Mumbai',
    '200206': 'HBT & Cooper Government Medical College, Mumbai',
    '200224': 'Rajiv Gandhi Medical College, Kalwa, Thane',
    '904357': 'ESIC Medical College, Andheri',
    '200225': 'R.C.S.M. Medical College, Kolhapur',
    '200207': 'Dr. Vaishampayan Government Medical College, Solapur',
    '200366': 'Mahatma Gandhi Institute of Medical Sciences, Sevagram, Wardha',
    '200208': 'Government Medical College, Nanded',
    '200228': 'Bhausaheb Hire Medical College, Dhule',
    '200440': 'Government Medical College, Jalgaon',
    '200576': 'Government Medical College, Satara',
    '200216': 'Government Medical College, Chandrapur',
    '200229': 'Swami Ramanand Tirth Medical College, Ambejogai',
    '200227': 'Vasantrao Naik Medical College, Yavatmal',
    '200579': 'Government Medical College, Alibaug',
}

ws = openpyxl.load_workbook(SRC, read_only=True, data_only=True)['OPEN']
sheet = {norm(r[1]): (r[1], r[2], str(r[3]).strip()) for r in list(ws.iter_rows(values_only=True))[2:] if isinstance(r[0], int)}

mcc = [c for c in json.load(open(f'{CUT}/all.json'))['categories']['OPEN'] if c['state'] == 'Maharashtra']
fee_of, used = {}, set()
for c in mcc:
    key = norm(ALIAS.get(c['code'], c['name']))
    if key not in sheet: raise SystemExit(f'no fee found for {c["code"]} {c["name"]}')
    name, est, fee = sheet[key]
    if c['establishment'] and c['establishment'] != est:
        raise SystemExit(f'establishment differs for {c["name"]}: {c["establishment"]} vs {est} in the fee file')
    fee_of[c['code']] = fee; used.add(key)
unused = [v[0] for k, v in sheet.items() if k not in used]
if unused: raise SystemExit(f'fee file colleges that matched no MCC college: {unused}')
print(f'{len(fee_of)} Maharashtra government MBBS colleges matched 1:1 with the fee file')

def dump(path, obj, **kw):
    with open(path, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, **kw)

changed = {}
# ---- cutoff files: every category file plus all.json
def set_fees(colleges):
    for c in colleges:
        if c['code'] in fee_of:
            new = f'{fee_of[c["code"]]}/-'
            if c.get('fees') != new: changed.setdefault(c['code'], (c['name'], c.get('fees'), new))
            c['fees'] = new
for f in sorted(glob.glob(f'{CUT}/*.json')):
    d = json.load(open(f))
    if f.endswith('all.json'):
        for cols in d['categories'].values(): set_fees(cols)
    else: set_fees(d['colleges'])
    if not DRY: dump(f, d, indent=2)

# ---- seat matrix: MBBS rows of these colleges (NRI rows keep their own fee)
rows_changed = 0
for f in sorted(glob.glob(f'{SEAT}/round*.json')) + [f'{SEAT}/stray.json']:
    rows = json.load(open(f))
    for x in rows:
        if x['code'] in fee_of and x['branch'].startswith('MBBS') and not re.search(r'NRI|Non-Resident', x['quota']):
            new = digits(fee_of[x['code']])
            if x['fee'] != new: rows_changed += 1
            x['fee'] = new
    if not DRY: dump(f, rows, separators=(',', ':'))

print(f'cutoff data: fee changed for {len(changed)} colleges | seat matrix: {rows_changed} rows updated')
for code, (name, old, new) in list(changed.items())[:8]: print(f'  {name[:46]:46s} {old} -> {new}')
print('(dry run, nothing written)' if DRY else 'written.')

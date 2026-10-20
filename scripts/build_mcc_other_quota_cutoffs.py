"""Build the MCC 2026 cutoffs for the quotas that are not in the main All India / Open Seat / Deemed files:
Delhi University, IP University, ESI, AMU, Jamia, Puducherry domicile, Muslim / Jain minority at central
institutes, Delhi NCR CW and Foreign Country quotas.

Usage: python3 scripts/build_mcc_other_quota_cutoffs.py <input_dir> [--dry-run]
  input_dir: allot_round1.xlsx, allot_round2.xlsx, allot_round3.xlsx and optionally allot_stray.xlsx
  (MCC "all allotments" lists)

Same rules as build_mcc_cutoffs.py: the cutoff (AIR) is the last (highest) rank allotted in that college /
quota / category in the round; AIR_PWD is the same for the PwD seat. Retained rows and "Did not fill up
fresh choices" rows are ignored. MBBS and BDS only, B.Sc Nursing quotas are dropped.
Writes nextjs-sandbox/public/data/cutoffs/MCC/2026/OTHER_QUOTA/all.json
"""
import json, os, re, sys, collections
import openpyxl

SRC = sys.argv[1]
DRY = '--dry-run' in sys.argv
OUT = 'nextjs-sandbox/public/data/cutoffs/MCC/2026/OTHER_QUOTA'
SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'
ROUNDS = [('Round 1', 'allot_round1.xlsx', 'round1'), ('Round 2', 'allot_round2.xlsx', 'round2'),
          ('Round 3', 'allot_round3.xlsx', 'round3'), ('Stray Vacancy Round', 'allot_stray.xlsx', 'stray')]

norm = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
CAT = {'General': 'OPEN', 'OBC': 'OBC', 'EWS': 'EWS', 'SC': 'SC', 'ST': 'ST'}

by_name, info = {}, {}
for _, _, rd in ROUNDS:
    for x in json.load(open(f'{SEAT}/{rd}.json')):
        by_name.setdefault(norm(re.sub(r'\(\d{5,6}\)\s*$', '', x['institute'])), x['code'])
        t = 'Government' if x['type'] == 'ESI' else x['type']
        i = info.setdefault(x['code'], dict(code=x['code'], name=x['collegeName'], state=x['state'], establishment=x['establishment'], type=t, fees=None))
        if i['establishment'] is None: i['establishment'] = x['establishment']
        if i['fees'] is None and x['fee'] and not re.search(r'NRI|Non-Resident', x['quota']): i['fees'] = f"{x['fee']:,}/-"

COVERED = {   # (institution type, squashed quota) already in the main cutoff files
    ('Government', 'allindia'), ('AIIMS', 'openseatquota'), ('JIPMER', 'openseatquota'), ('Central University', 'openseatquota'),
    ('Deemed', 'selffinancedmeritseat'), ('Deemed', 'nonresidentindian'), ('Deemed', 'muslimminorityquota'), ('Deemed', 'jainminorityquota')}

def canon(q):
    s = norm(q)
    if 'nursing' in s: return None
    if s == 'delhiuniversityquota': return 'Delhi University Quota'
    if s == 'ipuniversityquota': return 'IP University Quota'
    if s.startswith('employe'): return 'ESI Quota'
    if s.startswith('internalpuducherry'): return 'Puducherry UT Domicile (Internal)'
    if s == 'aligarhmuslimuniversityamuquota': return 'AMU Quota'
    if s == 'amuselffinanceallindia': return 'AMU Self Finance (All India)'
    if s == 'amuselffinanceinternal': return 'AMU Self Finance (Internal)'
    if s == 'nonresidentindianamuquota': return 'NRI Quota'
    if s == 'nonresidentindianjamiaquota': return 'NRI Quota'
    if 'cw' in s and s.endswith(('duquota', 'cwdu')): return 'Delhi NCR CW Quota (DU)'
    if 'cw' in s and s.endswith(('ipquota', 'cwip')): return 'Delhi NCR CW Quota (IP)'
    names = {'muslimquota': 'Muslim Quota', 'muslimobcquota': 'Muslim Quota', 'muslimstquota': 'Muslim Quota',
             'muslimwomenquota': 'Muslim Quota', 'muslimminorityquota': 'Muslim Minority Quota', 'jainminorityquota': 'Jain Minority Quota',
             'jamiainternalquota': 'Jamia Internal Quota', 'foreigncountryquota': 'Foreign Country Quota',
             'allindia': 'All India Quota', 'openseatquota': 'Open Seat Quota', 'selffinancedmeritseat': 'Self Financed Merit Seat', 'nonresidentindian': 'NRI Quota'}
    if s in names: return names[s]
    raise SystemExit(f'unknown quota: {q!r}')

def seat_cat(quota, raw_quota, cat):
    """NRI seats are the NRI category (as for the deemed universities); the Muslim Women seats are a category
    of their own under the merged Muslim Quota."""
    if quota == 'NRI Quota': return 'NRI'
    return 'WOMEN' if norm(raw_quota) == 'muslimwomenquota' else cat

def load(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = head = None
    for sh in wb.worksheets:
        got = list(sh.iter_rows(values_only=True))
        for i, r in enumerate(got[:6]):
            if r and 'Rank' in r and 'Allotted Institute' in r: rows, head = got, i
    col = {n: i for i, n in enumerate(rows[head]) if n}
    out, missing = [], collections.Counter()
    for r in rows[head + 1:]:
        if not isinstance(r[col['Rank']], int) or r[col['Course']] not in ('MBBS', 'BDS'): continue
        rem = re.sub(r'\s+', ' ', str(r[col['Remarks']]))
        if rem.startswith('Retained') or rem.startswith('Did not fill'): continue
        name = re.sub(r'\(\s*female\s+seat\s+only\s*\)\s*$', '', str(r[col['Allotted Institute']]), flags=re.I)
        code = by_name.get(norm(name))
        if not code: missing[name] += 1; continue
        quota = canon(r[col['Allotted Quota']])
        if quota is None: continue
        if (info[code]['type'], norm(r[col['Allotted Quota']])) in COVERED: continue
        acat = re.sub(r'\s+', ' ', str(r[col['Alloted Category']])).strip()
        acat = re.sub(r'^Open\b', 'General', acat)
        out.append((code, r[col['Course']], quota, seat_cat(quota, r[col['Allotted Quota']], CAT[acat.replace(' PwD', '')]), acat.endswith('PwD'), r[col['Rank']]))
    if missing: raise SystemExit(f'institutes not found in the seat matrix: {dict(missing)}')
    return out

entries = {}
for rname, fn, _ in ROUNDS:
    if not os.path.exists(f'{SRC}/{fn}'): continue
    n = 0
    for code, course, quota, cat, pwd, rank in load(f'{SRC}/{fn}'):
        e = entries.setdefault((code, course, quota), dict(info[code], course=course, quota=quota, cats={}))
        d = e['cats'].setdefault(cat, {}).setdefault(rname, {'AIR': None, 'AIR_PWD': None})
        k = 'AIR_PWD' if pwd else 'AIR'
        d[k] = max(d[k] or 0, rank); n += 1
    print(f'{rname}: {n} fresh / upgraded allotments in the other quotas')

ALL_ROUNDS = [r for r, _, _ in ROUNDS]
SEAT_CAT = {'OP': 'OPEN', 'BC': 'OBC', 'EW': 'EWS', 'SC': 'SC', 'ST': 'ST'}
seats = collections.Counter()   # (round, code, course, quota, category) -> seats, normal and PwD together
for rname, _, rd in ROUNDS:
    for x in json.load(open(f'{SEAT}/{rd}.json')):
        course = x['branch'].split()[0]
        if (info[x['code']]['type'], norm(x['quota'])) in COVERED: continue
        try: q = canon(x['quota'])
        except SystemExit: continue   # the seat matrix has a few quota names cut short (Delhi NCR CW); they get no seat count
        if q is None: continue
        seats[(rname, x['code'], course, q, seat_cat(q, x['quota'], SEAT_CAT[x['category'].split()[0]]))] += x['seats']

for e in entries.values():
    for cname, cat in e['cats'].items():
        for r in ALL_ROUNDS: cat.setdefault(r, {'AIR': None, 'AIR_PWD': None})
        for r in ALL_ROUNDS: cat[r]['Intake'] = seats.get((r, e['code'], e['course'], e['quota'], cname)) or None
data = sorted(entries.values(), key=lambda e: (e['quota'], e['course'], e['name']))
quotas = collections.Counter(e['quota'] for e in data)
print(len(data), 'college / course / quota rows')
for q, n in sorted(quotas.items()): print(f'  {q:40s} {n}')
if not DRY:
    os.makedirs(OUT, exist_ok=True)
    with open(f'{OUT}/all.json', 'w', encoding='utf-8') as f:
        json.dump(dict(counselling='MCC', institution_type='OTHER_QUOTA', year=2026, entries=data), f, ensure_ascii=False, separators=(',', ':'))
    print('written')

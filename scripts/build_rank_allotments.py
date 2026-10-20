"""Build the rank-wise allotment data of the MCC UG 2026 cutoff app (page /mcc-rank-allotment.html).

Usage: python3 scripts/build_rank_allotments.py <input_dir>
  input_dir: allot_round1.xlsx, allot_round2.xlsx, allot_round3.xlsx and allot_stray.xlsx (MCC "all allotments" lists)

One compact row per candidate and round: [rank, college, course, quota, category, status]. The candidate's score and
candidate category are left out. MBBS and BDS only (B.Sc Nursing is dropped). Writes
nextjs-sandbox/public/data/allotments/MCC/2026/rankwise.json
"""
import json, os, re, sys, collections
import openpyxl

SRC = sys.argv[1]
SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'
OUT = 'nextjs-sandbox/public/data/allotments/MCC/2026'
INDEX = 'nextjs-sandbox/public/data/cutoffs/MCC/2026/college-index.json'
ROUNDS = [('r1', 'Round 1', 'allot_round1.xlsx'), ('r2', 'Round 2', 'allot_round2.xlsx'),
          ('r3', 'Round 3', 'allot_round3.xlsx'), ('r4', 'Stray', 'allot_stray.xlsx')]

norm = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
by_name, info = {}, {}
for rd in ('round1', 'round2', 'round3', 'stray'):
    for x in json.load(open(f'{SEAT}/{rd}.json')):
        by_name.setdefault(norm(re.sub(r'\(\d{5,6}\)\s*$', '', x['institute'])), x['code'])
        info.setdefault(x['code'], (x['collegeName'], x['state']))
district = {k: v.get('district', '') for k, v in json.load(open(INDEX)).items()}

def quota_label(q):
    s = norm(q)
    if 'nursing' in s: return None
    fixed = {'allindia': 'All India', 'openseatquota': 'Open Seat', 'selffinancedmeritseat': 'Self Financed Merit', 'nonresidentindian': 'NRI',
             'muslimminorityquota': 'Muslim Minority', 'jainminorityquota': 'Jain Minority', 'delhiuniversityquota': 'Delhi University',
             'ipuniversityquota': 'IP University', 'aligarhmuslimuniversityamuquota': 'AMU (Internal)', 'amuselffinanceallindia': 'AMU Self Finance (All India)',
             'amuselffinanceinternal': 'AMU Self Finance (Internal)', 'nonresidentindianamuquota': 'NRI (AMU)', 'nonresidentindianjamiaquota': 'NRI (Jamia)',
             'muslimquota': 'Muslim (Jamia)', 'muslimobcquota': 'Muslim OBC (Jamia)', 'muslimstquota': 'Muslim ST (Jamia)', 'muslimwomenquota': 'Muslim Women (Jamia)',
             'jamiainternalquota': 'Jamia Internal', 'foreigncountryquota': 'Foreign Country'}
    if s in fixed: return fixed[s]
    if s.startswith('employe'): return 'ESI'
    if s.startswith('internalpuducherry'): return 'Puducherry Domicile (Internal)'
    if 'cw' in s and s.endswith(('duquota', 'cwdu')): return 'Delhi NCR CW (DU)'
    if 'cw' in s and s.endswith(('ipquota', 'cwip')): return 'Delhi NCR CW (IP)'
    raise SystemExit(f'unknown quota: {q!r}')

def status(rem):
    r = re.sub(r'\s+', ' ', str(rem))
    if r.startswith('Retained'): return 'Retained'
    if r.startswith('Did not fill'): return 'Kept Seat'
    if r.startswith('Upgraded'): return 'Upgraded'
    return 'Fresh'   # "Allotted", "Fresh Allotted in nth Round"

colleges, cidx = [], {}
quotas, qidx = [], {}
cats, catidx = [], {}
STAT = ['Fresh', 'Upgraded', 'Retained', 'Kept Seat']
rounds_out, missing = {}, collections.Counter()
for key, label, fn in ROUNDS:
    wb = openpyxl.load_workbook(f'{SRC}/{fn}', read_only=True, data_only=True)
    rows = head = None
    for sh in wb.worksheets:
        got = list(sh.iter_rows(values_only=True))
        for i, r in enumerate(got[:6]):
            if r and 'Rank' in r and 'Allotted Institute' in r: rows, head = got, i
    col = {n: i for i, n in enumerate(rows[head]) if n}
    out = []
    for r in rows[head + 1:]:
        if not isinstance(r[col['Rank']], int) or r[col['Course']] not in ('MBBS', 'BDS'): continue
        ql = quota_label(r[col['Allotted Quota']])
        if ql is None: continue
        name = re.sub(r'\(\s*female\s+seat\s+only\s*\)\s*$', '', str(r[col['Allotted Institute']]), flags=re.I)
        code = by_name.get(norm(name))
        if not code: missing[name] += 1; continue
        cat = re.sub(r'\s+', ' ', str(r[col['Alloted Category']])).strip()
        cat = re.sub(r'^Open\b', 'General', cat)
        if code not in cidx: cidx[code] = len(colleges); colleges.append([info[code][0], info[code][1], district.get(code, ''), code])
        if ql not in qidx: qidx[ql] = len(quotas); quotas.append(ql)
        if cat not in catidx: catidx[cat] = len(cats); cats.append(cat)
        out.append([r[col['Rank']], cidx[code], 0 if r[col['Course']] == 'MBBS' else 1, qidx[ql], catidx[cat], STAT.index(status(r[col['Remarks']]))])
    out.sort(key=lambda x: x[0])
    rounds_out[key] = out
    print(label, len(out), 'candidates')
if missing: raise SystemExit(f'institutes not found in the seat matrix: {dict(missing)}')
os.makedirs(OUT, exist_ok=True)
data = dict(counselling='MCC', year=2026, rounds=[[k, l] for k, l, _ in ROUNDS], courses=['MBBS', 'BDS'], status=STAT, colleges=colleges,
            quotas=quotas, categories=cats, data=rounds_out)
with open(f'{OUT}/rankwise.json', 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
print(len(colleges), 'colleges,', len(quotas), 'quotas,', len(cats), 'categories;', os.path.getsize(f'{OUT}/rankwise.json') // 1024, 'KB')

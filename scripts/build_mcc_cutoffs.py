"""Update the MCC 2026 All India cutoffs (Round 1, 2, 3 and the Stray round) from the official MCC allotment lists.

Usage: python3 scripts/build_mcc_cutoffs.py <input_dir> [--dry-run]
  input_dir must contain: allot_round1.xlsx, allot_round2.xlsx, allot_round3.xlsx
  and, once MCC publishes it, allot_stray.xlsx (same columns) for the Stray Vacancy Round
  (MCC "all allotments" lists: SNo, Rank, Score, Allotted Quota, Allotted Institute, Course,
   Alloted Category, Candidate Category, Remarks)

Rules (checked against the existing Round 1 files, which this script does not touch):
  * Cutoff (AIR) = the last (highest) All India Rank allotted in that college / quota / seat category.
    AIR_PWD is the same for the PwD seat of that category.
  * Retained seats are ignored, so are "Did not fill up fresh choices" rows (those candidates just keep
    their earlier seat). Only Fresh / Upgraded allotments set a round's cutoff.
  * NRI is one category (no priority split): every fresh / upgraded NRI-quota allotment counts and goes
    into the NRI_P-I / NRI_P1 files; the P-II files are left empty.
  * Round 3 only: when an NRI seat is still on offer but no NRI candidate was allotted, the NRI seats have
    been converted to general merit, so the NRI cutoff is the college's last allotted rank.
  * MBBS and BDS only. B.Sc Nursing is ignored.
AIR / AIR_PWD (closing = the last rank freshly allotted) and OPEN_AIR / OPEN_AIR_PWD (opening = the first rank freshly allotted) come from the allotment lists. Intake is the number of seats allotted in the round, retained seats included (also from the allotment lists). Intake and every other field stay as they were.
"""
import json, os, re, sys, collections
import openpyxl

SRC = sys.argv[1]
DRY = '--dry-run' in sys.argv
ROOT = 'nextjs-sandbox/public/data/cutoffs/MCC/2026'
SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'

# round id -> key used in the cutoff files / allotment file / seat-matrix file
RKEY = {1: 'Round 1', 2: 'Round 2', 3: 'Round 3', 'stray': 'Stray Vacancy Round'}
AFILE = {1: 'allot_round1.xlsx', 2: 'allot_round2.xlsx', 3: 'allot_round3.xlsx', 'stray': 'allot_stray.xlsx'}
SEATKEY = {1: 'round1', 2: 'round2', 3: 'round3', 'stray': 'stray'}
ROUND_IDS = [k for k in (1, 2, 3, 'stray') if os.path.exists(f'{SRC}/{AFILE[k]}')]   # the Stray round only once its file exists

norm = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
squash = lambda s: re.sub(r'\s+', '', str(s))
CAT = {'General': 'OPEN', 'OBC': 'OBC', 'EWS': 'EWS', 'SC': 'SC', 'ST': 'ST'}
SEAT_CAT = {'OP': 'OPEN', 'BC': 'OBC', 'EW': 'EWS', 'SC': 'SC', 'ST': 'ST'}

# college code + institution type from the seat matrix (ESI colleges count as government)
by_name, ctype = {}, {}
seat_rows = {}
for rd in ('round1', 'round2', 'round3', 'stray'):
    seat_rows[rd] = json.load(open(f'{SEAT}/{rd}.json'))
    for x in seat_rows[rd]:
        by_name.setdefault(norm(re.sub(r'\(\d{5,6}\)\s*$', '', x['institute'])), x['code'])
        ctype[x['code']] = 'Government' if x['type'] == 'ESI' else x['type']

def load(k):
    """Read one allotment file. Finds the results sheet and the columns by their headings, because the
    Stray file has no Score column, keeps results on its second sheet and calls the open category 'Open'."""
    wb = openpyxl.load_workbook(f'{SRC}/{AFILE[k]}', read_only=True, data_only=True)
    rows = head = None
    for sh in wb.worksheets:
        got = list(sh.iter_rows(values_only=True))
        for i, r in enumerate(got[:6]):
            if r and 'Rank' in r and 'Allotted Institute' in r: rows, head = got, i
    if rows is None: raise SystemExit(f'{RKEY[k]}: could not find the allotment table in {AFILE[k]}')
    col = {name: i for i, name in enumerate(rows[head]) if name}
    out, missing = [], collections.Counter()
    for r in rows[head + 1:]:
        if not isinstance(r[col['Rank']], int): continue   # blank rows and the notes under the table
        if r[col['Course']] not in ('MBBS', 'BDS'): continue
        name = re.sub(r'\(\s*female\s+seat\s+only\s*\)\s*$', '', str(r[col['Allotted Institute']]), flags=re.I)
        code = by_name.get(norm(name))
        if not code: missing[name] += 1; continue
        acat = re.sub(r'\s+', ' ', str(r[col['Alloted Category']])).strip()
        acat = re.sub(r'^Open\b', 'General', acat)   # Stray file: 'Open' / 'Open PwD'
        out.append(dict(rank=r[col['Rank']], quota=squash(r[col['Allotted Quota']]), code=code, course=r[col['Course']],
                        acat=acat, rem=re.sub(r'\s+', ' ', str(r[col['Remarks']]))))
    if missing: raise SystemExit(f'{RKEY[k]}: institutes not found in the seat matrix: {dict(missing)}')
    return out

IGNORED = lambda r: r['rem'].startswith('Retained') or r['rem'].startswith('Did not fill')

# folder -> (institution type, course, quotas, kind)
JOBS = {
    'GOVT_MBBS': ('Government', 'MBBS', {'AllIndia'}, 'cat'), 'GOVT_BDS': ('Government', 'BDS', {'AllIndia'}, 'cat'),
    'AIIMS_MBBS': ('AIIMS', 'MBBS', {'OpenSeatQuota'}, 'cat'), 'JIPMER_MBBS': ('JIPMER', 'MBBS', {'OpenSeatQuota'}, 'cat'),
    'CENTRAL_MBBS': ('Central University', 'MBBS', {'OpenSeatQuota'}, 'cat'),
    'CENTRAL_BDS': ('Central University', 'BDS', {'OpenSeatQuota'}, 'cat'),
    'DEEMED_MBBS': ('Deemed', 'MBBS', None, 'deemed'), 'DEEMED_BDS': ('Deemed', 'BDS', None, 'deemed'),
}
MINORITY = {'MuslimMinorityQuota', 'JainMinorityQuota'}
MINORITY_CAT = {'MuslimMinorityQuota': 'MINORITY_MUSLIM', 'JainMinorityQuota': 'MINORITY_JAIN'}
SFM, NRI = 'Self-FinancedMeritSeat', 'Non-ResidentIndian'

def has_nri_seats(k, code, course):
    rows = seat_rows[SEATKEY[k]]
    return any(x['code'] == code and x['branch'].startswith(course) and re.search(r'NRI|Non-Resident', x['quota']) for x in rows)


def allotted(k, rows):
    """-> {(folder, category): {code: n}}: candidates holding a seat after the round, retained ones included
    (every row of the allotment list is one candidate; PwD and normal seats together)."""
    n = collections.defaultdict(lambda: collections.defaultdict(int))
    for folder, (itype, course, quotas, kind) in JOBS.items():
        for r in rows:
            if r['course'] != course or ctype.get(r['code']) != itype: continue
            if kind == 'cat':
                if r['quota'] in quotas: n[(folder, CAT[r['acat'].replace(' PwD', '')])][r['code']] += 1
            elif r['quota'] == SFM: n[(folder, 'OPEN')][r['code']] += 1
            elif r['quota'] in MINORITY:
                n[(folder, 'MINORITY')][r['code']] += 1; n[(folder, MINORITY_CAT[r['quota']])][r['code']] += 1
            elif r['quota'] == NRI: n[(folder, 'NRI_P-I' if folder == 'DEEMED_MBBS' else 'NRI_P1')][r['code']] += 1
    return n

def compute(k, rows):
    """-> {(folder, category): {code: {'AIR':..,'AIR_PWD':..}}}"""
    res = collections.defaultdict(lambda: collections.defaultdict(dict))
    bump = lambda d, key, v: d.__setitem__(key, max(d.get(key) or 0, v))
    low = lambda d, key, v: d.__setitem__(key, min(d.get(key) or v, v))   # opening AIR = best rank freshly allotted
    for folder, (itype, course, quotas, kind) in JOBS.items():
        pool = [r for r in rows if r['course'] == course and ctype.get(r['code']) == itype and not IGNORED(r)]
        if kind == 'cat':
            for r in pool:
                if r['quota'] not in quotas: continue
                d = res[(folder, CAT[r['acat'].replace(' PwD', '')])][r['code']]
                bump(d, 'AIR_PWD' if r['acat'].endswith('PwD') else 'AIR', r['rank'])
                low(d, 'OPEN_AIR_PWD' if r['acat'].endswith('PwD') else 'OPEN_AIR', r['rank'])
            continue
        sfm_last = {}
        for r in pool:
            if r['quota'] == SFM:
                bump(res[(folder, 'OPEN')][r['code']], 'AIR', r['rank']); bump(sfm_last, r['code'], r['rank'])
                low(res[(folder, 'OPEN')][r['code']], 'OPEN_AIR', r['rank'])
            elif r['quota'] in MINORITY:
                bump(res[(folder, 'MINORITY')][r['code']], 'AIR', r['rank'])
                bump(res[(folder, MINORITY_CAT[r['quota']])][r['code']], 'AIR', r['rank'])
                low(res[(folder, 'MINORITY')][r['code']], 'OPEN_AIR', r['rank'])
                low(res[(folder, MINORITY_CAT[r['quota']])][r['code']], 'OPEN_AIR', r['rank'])
            elif r['quota'] == NRI:   # one NRI category, no priority split (the BDS file is named NRI_P1)
                bump(res[(folder, 'NRI_P-I' if folder == 'DEEMED_MBBS' else 'NRI_P1')][r['code']], 'AIR', r['rank'])
                low(res[(folder, 'NRI_P-I' if folder == 'DEEMED_MBBS' else 'NRI_P1')][r['code']], 'OPEN_AIR', r['rank'])
        if k == 3:   # unfilled NRI seats are converted to general merit (decide for the Stray round once its results are in)
            p1 = 'NRI_P-I' if folder == 'DEEMED_MBBS' else 'NRI_P1'
            for code, last in sfm_last.items():
                if code not in res[(folder, p1)] and has_nri_seats(k, code, course):
                    res[(folder, p1)][code]['AIR'] = last; res[(folder, p1)][code]['OPEN_AIR'] = last
    return res

def dump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def indian(n):
    t = str(n); head, tail = t[:-3], t[-3:]
    while len(head) > 2: tail = head[-2:] + ',' + tail; head = head[:-2]
    return (head + ',' + tail) if head else tail
seat_fee = {}   # (code, course) -> annual fee from the seat matrix (non-NRI rows)
for rd in seat_rows.values():
    for x in rd:
        if x['fee'] and not re.search(r'NRI|Non-Resident', x['quota']): seat_fee.setdefault((x['code'], x['branch'].split()[0]), x['fee'])

stats = collections.Counter(); added = []
loaded = {k: load(k) for k in ROUND_IDS}
computed = {k: compute(k, loaded[k]) for k in ROUND_IDS}
held = {k: allotted(k, loaded[k]) for k in ROUND_IDS}
for folder in JOBS:
    cats = list(json.load(open(f'{ROOT}/{folder}/all.json'))['categories'])
    if JOBS[folder][3] == 'deemed':   # Muslim and Jain minority get their own category next to the combined MINORITY one
        cats += [c for c in ('MINORITY_MUSLIM', 'MINORITY_JAIN') if c not in cats]
    files = {cat: (json.load(open(f'{ROOT}/{folder}/{cat}.json')) if os.path.exists(f'{ROOT}/{folder}/{cat}.json')
                   else {'counselling': 'MCC', 'institution_type': folder, 'year': 2026, 'category': cat, 'colleges': []}) for cat in cats}
    sibling = {}   # code -> college entry from any category file (for colleges a category file does not list yet)
    for data in files.values():
        for c in data['colleges']: sibling.setdefault(c['code'], c)
    for cat, data in files.items():
        have = {c['code'] for c in data['colleges']}
        for k in ROUND_IDS:   # colleges that got an allotment but are missing from this category file
            for code in sorted(set(computed[k].get((folder, cat), {})) - have):
                src = sibling[code]
                blank = {r: {f: None for f in v} for r, v in src['rounds'].items()}
                data['colleges'].append({**{f: src[f] for f in src if f != 'rounds'}, 'rounds': blank})
                have.add(code); added.append(f'{folder}/{cat}: {code} {src["name"]}')
        for c in data['colleges']:
            if c.get('fees') in (None, '') and seat_fee.get((c['code'], JOBS[folder][1])):   # colleges the old fee list did not have
                c['fees'] = indian(seat_fee[(c['code'], JOBS[folder][1])]) + '/-'; stats['fee filled'] += 1
            for k in ROUND_IDS:
                new = computed[k].get((folder, cat), {}).get(c['code'], {})
                rd = c['rounds'][RKEY[k]]
                it = held[k].get((folder, cat), {}).get(c['code']) or None
                stats['intake unchanged' if rd.get('Intake') == it else 'intake fixed'] += 1
                rd['Intake'] = it
                rd.setdefault('OPEN_AIR', None); rd.setdefault('OPEN_AIR_PWD', None)
                for fld in ('AIR', 'AIR_PWD', 'OPEN_AIR', 'OPEN_AIR_PWD'):
                    if fld not in rd: continue
                    old, val = rd[fld], new.get(fld)
                    stats['unchanged' if old == val else 'filled' if old is None else 'cleared' if val is None else 'changed'] += 1
                    rd[fld] = val
        if not DRY: dump(f'{ROOT}/{folder}/{cat}.json', data)
    # all.json is the same data, grouped by category
    if not DRY:
        allj = json.load(open(f'{ROOT}/{folder}/all.json'))
        allj['categories'] = {cat: files[cat]['colleges'] for cat in cats}
        dump(f'{ROOT}/{folder}/all.json', allj)

print(' + '.join(RKEY[k] for k in ROUND_IDS), 'AIR / AIR_PWD cells:', dict(stats))
print('colleges added to a category file because they had allotments there:', len(added))
for n in added: print('  +', n)
print('(dry run, nothing written)' if DRY else 'written.')

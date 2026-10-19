"""Update the MCC 2026 All India cutoffs (Round 2 and Round 3) from the official MCC allotment lists.

Usage: python3 scripts/build_mcc_cutoffs.py <input_dir> [--dry-run]
  input_dir must contain: allot_round2.xlsx, allot_round3.xlsx
  (MCC "all allotments" lists: SNo, Rank, Score, Allotted Quota, Allotted Institute, Course,
   Alloted Category, Candidate Category, Remarks)

Rules (checked against the existing Round 1 files, which this script does not touch):
  * Cutoff (AIR) = the last (highest) All India Rank allotted in that college / quota / seat category.
    AIR_PWD is the same for the PwD seat of that category.
  * Retained seats are ignored, so are "Did not fill up fresh choices" rows (those candidates just keep
    their earlier seat). Only Fresh / Upgraded allotments set a round's cutoff.
  * NRI_P-I / NRI_P-II come from the Remarks column ("NRI Priority : 1" / ": 2").
  * Round 3 only: when an NRI seat is still on offer but no NRI candidate was allotted, the NRI seats have
    been converted to general merit, so the NRI cutoff is the college's last allotted rank.
  * MBBS and BDS only. B.Sc Nursing is ignored.
Only AIR and AIR_PWD of Round 2 / Round 3 are written. Intake and every other field stay as they were.
"""
import json, re, sys, collections
import openpyxl

SRC = sys.argv[1]
DRY = '--dry-run' in sys.argv
ROOT = 'nextjs-sandbox/public/data/cutoffs/MCC/2026'
SEAT = 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'

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
    ws = openpyxl.load_workbook(f'{SRC}/allot_round{k}.xlsx', read_only=True, data_only=True).active
    out, missing = [], collections.Counter()
    for r in list(ws.iter_rows(values_only=True))[1:]:
        if r[5] not in ('MBBS', 'BDS'): continue
        name = re.sub(r'\(\s*female seat only\s*\)\s*$', '', str(r[4]), flags=re.I)
        code = by_name.get(norm(name))
        if not code: missing[name] += 1; continue
        out.append(dict(rank=r[1], quota=squash(r[3]), code=code, course=r[5], acat=r[6], rem=str(r[8])))
    if missing: raise SystemExit(f'Round {k}: institutes not found in the seat matrix: {dict(missing)}')
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
SFM, NRI = 'Self-FinancedMeritSeat', 'Non-ResidentIndian'

def nri_priority(r):
    m = re.search(r'NRI Priority : (\d)', r['rem']); return int(m.group(1)) if m else None

def has_nri_seats(k, code, course):
    rows = seat_rows[f'round{k}']
    return any(x['code'] == code and x['branch'].startswith(course) and re.search(r'NRI|Non-Resident', x['quota']) for x in rows)

def compute(k, rows):
    """-> {(folder, category): {code: {'AIR':..,'AIR_PWD':..}}}"""
    res = collections.defaultdict(lambda: collections.defaultdict(dict))
    bump = lambda d, key, v: d.__setitem__(key, max(d.get(key) or 0, v))
    for folder, (itype, course, quotas, kind) in JOBS.items():
        pool = [r for r in rows if r['course'] == course and ctype.get(r['code']) == itype and not IGNORED(r)]
        if kind == 'cat':
            for r in pool:
                if r['quota'] not in quotas: continue
                d = res[(folder, CAT[r['acat'].replace(' PwD', '')])][r['code']]
                bump(d, 'AIR_PWD' if r['acat'].endswith('PwD') else 'AIR', r['rank'])
            continue
        sfm_last = {}
        for r in pool:
            if r['quota'] == SFM:
                bump(res[(folder, 'OPEN')][r['code']], 'AIR', r['rank']); bump(sfm_last, r['code'], r['rank'])
            elif r['quota'] in MINORITY:
                bump(res[(folder, 'MINORITY')][r['code']], 'AIR', r['rank'])
            elif r['quota'] == NRI and nri_priority(r) in (1, 2):
                p = nri_priority(r)
                name = ('NRI_P-I' if p == 1 else 'NRI_P-II') if folder == 'DEEMED_MBBS' else f'NRI_P{p}'   # BDS files are NRI_P1 / NRI_P2
                bump(res[(folder, name)][r['code']], 'AIR', r['rank'])
        if k == 3:   # unfilled NRI seats are converted to general merit
            p1 = 'NRI_P-I' if folder == 'DEEMED_MBBS' else 'NRI_P1'
            for code, last in sfm_last.items():
                if code not in res[(folder, p1)] and has_nri_seats(3, code, course):
                    res[(folder, p1)][code]['AIR'] = last
    return res

def dump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

stats = collections.Counter(); added = []
computed = {k: compute(k, load(k)) for k in (2, 3)}
for folder in JOBS:
    cats = list(json.load(open(f'{ROOT}/{folder}/all.json'))['categories'])
    files = {cat: json.load(open(f'{ROOT}/{folder}/{cat}.json')) for cat in cats}
    sibling = {}   # code -> college entry from any category file (for colleges a category file does not list yet)
    for data in files.values():
        for c in data['colleges']: sibling.setdefault(c['code'], c)
    for cat, data in files.items():
        have = {c['code'] for c in data['colleges']}
        for k in (2, 3):   # colleges that got an allotment but are missing from this category file
            for code in sorted(set(computed[k].get((folder, cat), {})) - have):
                src = sibling[code]
                blank = {r: {f: None for f in v} for r, v in src['rounds'].items()}
                data['colleges'].append({**{f: src[f] for f in src if f != 'rounds'}, 'rounds': blank})
                have.add(code); added.append(f'{folder}/{cat}: {code} {src["name"]}')
        for c in data['colleges']:
            for k in (2, 3):
                new = computed[k].get((folder, cat), {}).get(c['code'], {})
                rd = c['rounds'][f'Round {k}']
                for fld in ('AIR', 'AIR_PWD'):
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

print('Round 2 + Round 3 AIR / AIR_PWD cells:', dict(stats))
print('colleges added to a category file because they had allotments there:', len(added))
for n in added: print('  +', n)
print('(dry run, nothing written)' if DRY else 'written.')

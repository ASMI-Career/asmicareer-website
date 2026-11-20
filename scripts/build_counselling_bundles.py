"""Bundle the 2026 counsellor-mode cutoff data (MH, Open States, AACCC, VCI, MAFSU, Open BVSc) for the cutoff app.

Usage: python3 scripts/build_counselling_bundles.py
Reads  nextjs-sandbox/public/data/cutoffs/<COUNSELLING>/2026/...   (the files the counsellor page loads)
Writes nextjs-sandbox/public/data/bundles/2026/<name>.json         (one file per counselling / quota type, one request per tab)

Bundle format
  {counselling, name, year, rounds:[...], metric:{primary,label,...}, cats:[...], subs:{cat:[...]}, types, courses, states, quotas,
   hasPwd, colleges:[{code, name, state, type, course, quota, est, fees, cats:{"CAT|SUB": {round: {Intake, AIR, ...}}}}]}
The round values keep the names the source files use (Intake, AIR, AIR_PWD, SML, CSML, NEET_MARKS, REGION_MERIT, STATE_MERIT).
Re-run it whenever the counsellor data changes, then commit the bundles.
"""
import json, os, re, glob, collections

ROOT = 'nextjs-sandbox/public/data'
SRC = f'{ROOT}/cutoffs'
OUT = f'{ROOT}/bundles/2026'
YEAR = '2026'
os.makedirs(OUT, exist_ok=True)

def rkey(r):
    """Order rounds: Round 1..n, Stray Round 1..n, Special Stray Round 1..n, other stray names last."""
    m = re.match(r'^(Special Stray Round|Stray Round|Round)\s*(\d+)', r)
    if m: return ({'Round': 0, 'Stray Round': 1, 'Special Stray Round': 2}[m.group(1)], int(m.group(2)), r)
    return (3, 0, r)

def label(s): return re.sub(r'\s+', ' ', str(s).replace('_', ' ')).strip()

def fix_type(t): return re.sub(r'PR\s+IVATE', 'PRIVATE', re.sub(r'^Govt$', 'Government', str(t or '').strip()))

def dental(name): return bool(re.search(r'dental|dentistry', name, re.I))

class Bundle:
    def __init__(self, counselling, name, metric=None):
        self.b = dict(counselling=counselling, name=name, year=int(YEAR), metric=metric or dict(primary='AIR', label='AIR'))
        self.entries = {}; self.rounds = set()
        self.pwd = False
    def add(self, key, base, cat, sub, rounds):
        e = self.entries.setdefault(key, dict(base, cats={}))
        if base.get('est') and not e.get('est'): e['est'] = base['est']
        if base.get('fees') and not e.get('fees'): e['fees'] = base['fees']
        ck = f'{cat}|{sub}'
        clean = {}
        for r, v in (rounds or {}).items():
            if v is None: continue
            if not any(x is not None and x != '' for x in v.values()): continue
            clean[r] = {k: x for k, x in v.items() if x is not None and x != ''}
            if clean[r].get('AIR_PWD') is not None: self.pwd = True
            self.rounds.add(r)
        if clean: e['cats'][ck] = clean   # a category with no round data in this file is left out
    def write(self, fname, cat_order=None):
        cols = [c for c in self.entries.values() if c['cats']]    # drop colleges with no data in this file
        seen = collections.OrderedDict()
        for c in cols:
            for ck in c['cats']:
                cat, _, sub = ck.partition('|'); seen.setdefault(cat, [])
                if sub not in seen[cat]: seen[cat].append(sub)
        cats = list(seen)
        if cat_order: cats.sort(key=lambda c: (cat_order.index(c) if c in cat_order else 99, c))
        for c in cats: seen[c].sort(key=lambda x: (x != 'GENERAL', x != 'GEN_BOTH', x))
        b = dict(self.b, rounds=sorted(self.rounds, key=rkey), cats=cats, subs={c: seen[c] for c in cats},
                 types=sorted({c['type'] for c in cols if c.get('type')}), courses=sorted({c['course'] for c in cols if c.get('course')}),
                 states=sorted({c['state'] for c in cols if c.get('state')}), quotas=sorted({c['quota'] for c in cols if c.get('quota')}),
                 hasPwd=self.pwd, colleges=cols)
        with open(f'{OUT}/{fname}.json', 'w', encoding='utf-8') as f: json.dump(b, f, ensure_ascii=False, separators=(',', ':'))
        print(f'{fname:22s} {len(cols):5d} colleges {len(b["rounds"])} rounds {len(cats):3d} categories {os.path.getsize(f"{OUT}/{fname}.json")//1024:5d} KB')

CAT_ORDER = ['OPEN', 'OBC', 'EWS', 'SC', 'ST', 'SEBC']

# ---- Maharashtra State (CAP): one bundle per quota type (course x government / private)
for q in sorted(os.listdir(f'{SRC}/MH/{YEAR}')):
    typ, _, course = q.partition('_')
    tname = {'GOVT': 'Government', 'PRIVATE': 'Private', 'AYUSH': 'AIQ'}.get(typ, typ)
    course = course or 'AYUSH'
    b = Bundle('MH', q)
    for f in sorted(glob.glob(f'{SRC}/MH/{YEAR}/{q}/*/*.json')):
        d = json.load(open(f)); cat, sub = d['category'], d['sub_type']
        for c in d['colleges']:
            key = c.get('code') or c['name']
            b.add(key, dict(code=c.get('code'), name=c['name'], state='Maharashtra', type=tname, course=course, quota=label(q), est=c.get('establishment'), fees=c.get('fees')), cat, sub, c.get('rounds'))
    b.write(f'mh_{q}', CAT_ORDER)

# ---- Open States (MBBS / BDS, the other states' own counselling)
def open_bundle(root, name, course_of):
    b = Bundle('OPEN', name)
    for sd in sorted(glob.glob(f'{SRC}/{root}/{YEAR}/*/')):
        state = os.path.basename(os.path.dirname(sd)).replace('_', ' ')
        for f in sorted(glob.glob(sd + '*.json')):
            if f.endswith('.all.json'): continue
            raw = json.load(open(f)); docs = raw if isinstance(raw, list) else [raw]   # a few files hold a list of quota documents
            for d in docs:
                quota = d.get('quota') or os.path.basename(f)[:-5]
                for c in d['colleges']:
                    key = f"{state}|{quota}|{c.get('code') or c['name']}"
                    b.add(key, dict(code=c.get('code'), name=c['name'], state=state, type=fix_type(c.get('type')), course=course_of(c['name']), quota=label(quota), est=c.get('establishment'), fees=c.get('fees')), 'ALL', '', c.get('rounds'))
    return b
open_bundle('OPEN', 'open_med', lambda n: 'BDS' if dental(n) else 'MBBS').write('open_med')
if os.path.isdir(f'{SRC}/OPEN_AYUSH/{YEAR}'): open_bundle('OPEN_AYUSH', 'open_ayush', lambda n: 'AYUSH').write('open_ayush')
open_bundle('OPEN_BVSC', 'open_bvsc', lambda n: 'BVSc').write('open_bvsc')

# ---- AACCC (central AYUSH counselling): folder = COURSE_QUOTA
AACCC_Q = {'AG': 'AIQ Govt', 'GA': 'AIQ Govt Aided', 'CU': 'Central Univ / National Inst', 'PS': 'Management / Paid', 'JG': 'Jain Minority (Govt Aided)',
           'LM': 'Linguistic Minority', 'MM': 'Muslim Minority', 'MG': 'Muslim Minority (Govt Aided)', 'NR': 'NRI', 'SF': 'Self Finance'}
b = Bundle('AACCC', 'aaccc')
for f in sorted(glob.glob(f'{SRC}/AACCC/{YEAR}/*/*.json')):
    folder = os.path.basename(os.path.dirname(f)); course, _, q = folder.partition('_')
    d = json.load(open(f)); cat = d['category']
    for c in d['colleges']:
        b.add(f'{folder}|{c.get("code") or c["name"]}', dict(code=c.get('code'), name=c['name'], state=c.get('state') or '', type=c.get('type') or '', course=course, quota=AACCC_Q.get(q, q), est=c.get('establishment'), fees=c.get('fees')), cat, '', c.get('rounds'))
b.write('aaccc', CAT_ORDER)

# ---- VCI (veterinary, 15% All India quota)
b = Bundle('VCI', 'vci')
for f in sorted(glob.glob(f'{SRC}/VCI/{YEAR}/*/*.json')):
    folder = os.path.basename(os.path.dirname(f)); d = json.load(open(f)); cat = d['category']
    for c in d['colleges']:
        b.add(f'{folder}|{c.get("code") or c["name"]}', dict(code=c.get('code'), name=c['name'], state=c.get('state') or '', type=(c.get('type') or label(folder.split('_')[0]).title()), course='BVSc', quota='15% AIQ', est=c.get('establishment'), fees=c.get('fees')), cat, '', c.get('rounds'))
b.write('vci', CAT_ORDER)

# ---- MAFSU (Maharashtra Animal & Fishery Sciences University, BVSc): merit numbers and NEET marks, not AIR
MAFSU_Q = {'STATE': 'State Merit', 'REGION': 'Region Merit', 'COMBINED': 'Combined (Round 3)', 'SPECIAL': 'Special Round', 'MGMT': 'Management', 'NRIINDIA': 'NRI (India)', 'NRIABROAD': 'NRI (Abroad)'}
b = Bundle('MAFSU', 'mafsu', metric=dict(primary='MERIT', label='Merit No.', note='State merit number for State, Region merit number for Region quota; NEET marks shown below'))
for f in sorted(glob.glob(f'{SRC}/MAFSU/{YEAR}/*/*/*.json')):
    parts = f.split('/'); folder, cat = parts[-3], parts[-2]
    inst, _, quota = folder.partition('_'); d = json.load(open(f)); sub = d.get('sub_type') or ''
    field = 'REGION_MERIT' if quota == 'REGION' else 'STATE_MERIT'
    for c in d['colleges']:
        rounds = {}
        for r, v in (c.get('rounds') or {}).items():
            if not v: continue
            m = v.get(field) if v.get(field) is not None else v.get('STATE_MERIT') if v.get('STATE_MERIT') is not None else v.get('REGION_MERIT')
            rounds[r] = dict(Intake=v.get('Intake'), AIR=m, NEET_MARKS=v.get('NEET_MARKS'), REGION_MERIT=v.get('REGION_MERIT'), STATE_MERIT=v.get('STATE_MERIT'))
        b.add(f'{folder}|{c["name"]}', dict(code=None, name=c['name'], state=c.get('state') or 'Maharashtra', type=c.get('type') or ('Govt' if inst == 'GOVT' else 'Private'), course='BVSc', quota=MAFSU_Q.get(quota, quota), est=c.get('establishment'), fees=c.get('fees')), cat, sub, rounds)
b.write('mafsu', CAT_ORDER)

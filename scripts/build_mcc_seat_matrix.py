"""Build MCC UG 2026 seat-matrix JSON (Round 1, 2, 3, Stray) from the official MCC files.

Usage: python3 scripts/build_mcc_seat_matrix.py <input_dir> [output_dir]
  input_dir must contain: round_1.xlsx, ROUND_2_CLEAR_VACANCY.xlsx,
  ROUND_3_CLEAR_VACANCY.pdf, STRAY_ROUND.pdf
Every parsed round is checked against the grand total printed in the source file.
"""
import json, re, sys, os, glob
import openpyxl, pdfplumber

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else 'nextjs-sandbox/public/data/seat-matrix/MCC/2026'

TYPE = {'All India except Central University': 'Government', 'Deemed University': 'Deemed',
        'All India Institute Of Medical': 'AIIMS', 'All India Institute Of Medical Science(AIIMS)': 'AIIMS',
        'Employees State Insurance Scheme': 'ESI', 'B.Sc Nursing NEET UG': 'B.Sc Nursing',
        'Central University': 'Central University',
        'Jawaharlal Institute of Postgraduate Medical Education and Research': 'JIPMER'}
CAT = {'OP': 'General / UR', 'BC': 'OBC', 'SC': 'Scheduled Caste (SC)', 'ST': 'Scheduled Tribe (ST)', 'EW': 'EWS'}
# Names the heuristic (first two comma parts) gets wrong
NAME_FIX = {'904771': ('Bagalkote Medical College and Research Institute', 'Bagalkote'),
            '904772': ('Government Medical College Chapra (Saran)', 'Chapra'),
            '904773': ('Shri Ram Janki Medical College and Hospital', 'Samastipur'),
            '905631': ('Datta Meghe Dental College', 'Nagpur'),
            '200511': ('AIIMS Bathinda', 'Bathinda'),
            '200329': ('K M Shah Dental College', 'Vadodara'),
            '200494': ('Government Dental College Kannur', 'Kannur'),
            '200470': ('NAMO Medical Education & Research Institute', 'Silvassa'),
            '200541': ('Ahilya Bai College of Nursing', ''),
            '200293': ('Dr. Bhimrao Ramji Ambedkar Government Medical College', ''),
            '200540': ('Sri Lalithambigai Medical College and Hospital', ''),
            '200503': ('AIIMS Bhopal', 'Bhopal'),
            '200441': ('Government Medical College', 'Kadapa'),
            '200443': ('Government Medical College', 'Ongole')}
# MCC Notice 19 (05.09.2026): seats added to Round 2 after the clear-vacancy list
R2_ADDED = {'904771': {'UR': 6, 'ST': 1, 'SC': 2, 'OBC': 3, 'OBC PwD': 1, 'EWS': 2},
            '904772': {'UR': 4, 'SC': 1, 'OBC': 2},
            '904773': {'UR': 1, 'UR PwD': 1, 'ST': 1, 'SC': 2, 'OBC': 2, 'EWS': 1}}
ADD_CAT = {'UR': 'OP NO', 'UR PwD': 'OP PH', 'OBC': 'BC NO', 'OBC PwD': 'BC PH', 'SC': 'SC NO', 'ST': 'ST NO', 'EWS': 'EW NO'}

clean = lambda v: re.sub(r'\s+', ' ', str(v)).strip()
fix_split = lambda s: re.sub(r'-\s+(\d{6})', r'-\1', s)  # "Port Blair-\n744104" wraps

def raw_xlsx(path):
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True).active
    rows, total = [], None
    for r in ws.iter_rows(values_only=True):
        if r[1] is None and isinstance(r[6], int): total = r[6]; continue
        if r[0] in (None, 'StateName') or not isinstance(r[6], int): continue
        rows.append(r)
    return rows, total

def raw_pdf(path):
    rows, total = [], None
    with pdfplumber.open(path) as p:
        for pg in p.pages:
            for t in pg.extract_tables():
                for r in t:
                    if len(r) != 7 or not r[6] or not r[6].strip().isdigit(): continue
                    if r[1] is None and r[2] is None:  # grand-total row ("Total" or blank label)
                        total = int(r[6])
                    elif all(c is not None for c in r) and r[0] != 'StateName':
                        rows.append(r)
    return rows, total

def code(inst):
    m = re.search(r'\((\d{5,6})\)\s*$', inst); return m.group(1) if m else None

def guess(inst):
    parts = [p.strip() for p in inst.split(',')]
    name, city = parts[0], (parts[1] if len(parts) > 1 else '')
    if re.match(r'(?i)hospital\b', city):          # "Shri B M Patil Medical College, Hospital & Research Centre"
        name, city = f'{name} {city}', ''
    # MCC address text sometimes lands in the city slot; show a city only when it looks like one
    if len(city) > 25 or '(' in city or ')' in city or re.search(r'\d', city):
        city = ''
    return name, city

def convert(rows, names, gender_col=False):
    out = []
    for r in rows:
        inst = clean(r[2]); inst = fix_split(inst); c = code(inst)
        a, b = clean(r[5]).split()
        name, city = NAME_FIX.get(c) or names.get(c) or guess(inst)
        out.append(dict(state=clean(r[0]), type=TYPE[clean(r[1])], institute=inst, code=c, quota=clean(r[3]),
                        branch=clean(r[4]), category=f'{a} {b}', categoryFull=CAT[a] + (' - PwBD' if b == 'PH' else ''),
                        seats=int(r[6]), collegeName=name, city=city,
                        gender=(r[7] if gender_col else None), added=False))
    return out

r1, t1 = raw_xlsx(f'{SRC}/round_1.xlsx')
r2, t2 = raw_xlsx(f'{SRC}/ROUND_2_CLEAR_VACANCY.xlsx')
r3, t3 = raw_pdf(f'{SRC}/ROUND_3_CLEAR_VACANCY.pdf')
rs, ts = raw_pdf(f'{SRC}/STRAY_ROUND.pdf')

# Seat Matrix R1 carries the fullest institute strings -> build the code -> (name, city) map from all rounds
names = {}
for rows in (r1, r2, r3, rs):
    for r in rows:
        c = code(fix_split(clean(r[2])))
        if c and c not in names: names[c] = guess(fix_split(clean(r[2])))

rounds = {'round1': (convert(r1, names, True), t1), 'round2': (convert(r2, names), t2),
          'round3': (convert(r3, names), t3), 'stray': (convert(rs, names), ts)}

# Round 2 addendum
by_code = {x['code']: x for k in ('round3', 'stray') for x in rounds[k][0]}
added = 0
for c, cats in R2_ADDED.items():
    base = by_code[c]
    for k, n in cats.items():
        cat = ADD_CAT[k]; a, b = cat.split()
        rounds['round2'][0].append(dict(base, category=cat, categoryFull=CAT[a] + (' - PwBD' if b == 'PH' else ''),
                                        seats=n, quota='All India', branch='MBBS (MBBS)', gender=None, added=True))
        added += n
assert added == 30

os.makedirs(OUT, exist_ok=True)
META = {'round1': ('Round 1', 'Seat Matrix for Round 1 NEET UG MBBS BDS & BSc Nursing'),
        'round2': ('Round 2', 'Clear Vacancy Round 2 + 30 seats added by MCC Notice 19 (05.09.2026)'),
        'round3': ('Round 3', 'Clear Vacancy Round 3'), 'stray': ('Stray Vacancy', 'Clear Vacancy Stray Vacancy Round')}
index = []
for k, (rows, total) in rounds.items():
    seats = sum(x['seats'] for x in rows)
    expect = total + (30 if k == 'round2' else 0)
    assert seats == expect, f'{k}: parsed {seats} != source total {expect}'
    json.dump(rows, open(f'{OUT}/{k}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    index.append(dict(id=k, label=META[k][0], source=META[k][1], rows=len(rows), seats=seats))
    print(f'{k}: {len(rows)} rows, {seats} seats (source total {total}{" + 30 added" if k=="round2" else ""}) OK')
json.dump(dict(counselling='MCC', year=2026, rounds=index), open(f'{OUT}/index.json', 'w'), indent=1)

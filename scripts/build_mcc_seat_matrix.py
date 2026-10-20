"""Build MCC UG 2026 seat-matrix JSON (Round 1, 2, 3, Stray) from the official MCC files.

Usage: python3 scripts/build_mcc_seat_matrix.py <input_dir> [output_dir]
  input_dir must contain: round_1.xlsx, ROUND_2_CLEAR_VACANCY.xlsx,
  ROUND_3_CLEAR_VACANCY.pdf, STRAY_ROUND.pdf, AIQ_MBBS.xlsx and BDS.xlsx (ASMI MBBS / BDS name + fee lists)
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
# colleges that started in 2026 (the ASMI lists have no year for them)
EST_FIX = {'905629': 2026, '905630': 2026}
NAME_FIX = {'904771': ('Bagalkote Medical College and Research Institute', 'Bagalkote'),
            '904772': ('Government Medical College Chapra (Saran)', 'Chapra'),
            '904773': ('Shri Ram Janki Medical College and Hospital', 'Samastipur'),
            '905631': ('Datta Meghe Dental College', 'Nagpur'),
            '200511': ('AIIMS Bathinda', 'Bathinda'),
            '200329': ('K M Shah Dental College', 'Vadodara'),
            '200494': ('Government Dental College Kannur', 'Kannur'),
            '200470': ('NAMO Medical Education & Research Institute', 'Silvassa'),
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

CITY_ALIAS = {'Bangalore': 'Bengaluru', 'Mysore': 'Mysuru', 'Mangalore': 'Mangaluru', 'Hubli': 'Hubballi',
              'Pudukottai': 'Pudukkottai', 'Allahabad': 'Prayagraj', 'Baroda': 'Vadodara', 'Faizabad': 'Ayodhya'}
# names in the ASMI lists that carry no ', City' suffix
CITY_BY_CODE = {'200642': 'Dhubri', '200633': 'Navsari', '200670': 'Alwar', '200454': 'Hyderabad', '200466': 'Coochbehar',
                '200608': 'Chikkamagaluru', '200610': 'Haveri', '200607': 'Chittorgarh',
                '200613': 'Barasat', '200604': 'Tamluk'}

def city_of(code, name, states):
    """No district data exists in any source file; the ASMI institute name ends with the city/town."""
    c = CITY_BY_CODE.get(code) or (name.rsplit(',', 1)[1].strip() if ',' in name else '')
    c = CITY_ALIAS.get(c, c)
    return '' if c in states else c   # a trailing state name is not a city

def load_master(path, nri_sheet):
    """ASMI MBBS/BDS list: code -> official name, establishment year, annual fee (and NRI fee for deemed)."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    num = lambda v: int(re.sub(r'\D', '', str(v))) if re.search(r'\d', str(v)) else None
    master = {}
    for ws in wb:
        if ws.title == nri_sheet: continue
        for r in list(ws.iter_rows(values_only=True))[2:]:
            if r[1]:
                master[str(r[1]).strip()] = dict(name=clean(r[2]), est=r[4], fee=num(r[5]), nri=None,
                                                 city=city_of(str(r[1]).strip(), clean(r[2]), STATES))
    for r in list(wb[nri_sheet].iter_rows(values_only=True))[2:]:
        if r[1] and clean(r[5]).startswith('$'): master[str(r[1]).strip()]['nri'] = clean(r[5])
    return master

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

# The MCC files cut some Delhi NCR armed-forces (CW) quota names short ("Delhi NCR Children/Widows of Personnel of the").
# The allotment lists say which university quota each of these colleges uses.
CW_DU = {'200448', '200449', '200450', '200451'}          # Lady Hardinge, MAMC, UCMS, MAIDS: Delhi University quota
CW_IP = {'904361', '200495', '200498'}                     # ESIC Basaidarapur, VMMC, ABVIMS: IP University quota
def fix_quota(q, c):
    if q.startswith('Delhi NCR Children/Widows of') and not re.search(r'\(CW\) (DU|IP)', q):
        return 'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) ' + ('DU' if c in CW_DU else 'IP' if c in CW_IP else '?')
    return q

def convert(rows, names, gender_col=False):
    out = []
    for r in rows:
        inst = clean(r[2]); inst = fix_split(inst); c = code(inst)
        a, b = clean(r[5]).split()
        name, city = NAME_FIX.get(c) or names.get(c) or guess(inst)
        out.append(dict(state=clean(r[0]), type=TYPE[clean(r[1])], institute=inst, code=c, quota=fix_quota(clean(r[3]), c),
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

# B.Sc Nursing is not part of this product: drop it, remembering its seats so totals still reconcile
nursing_seats = {}
for k, (rows, total) in list(rounds.items()):
    nursing_seats[k] = sum(x['seats'] for x in rows if x['branch'].startswith('B.Sc'))
    rounds[k] = ([x for x in rows if not x['branch'].startswith('B.Sc')], total)

STATES = {x[0].strip() for x in r1 + r2 + r3 + rs} | {'Assam', 'Karnataka', 'Rajasthan'}
STATES -= {'Puducherry', 'Delhi', 'Goa', 'Chandigarh'}  # these are also city names
# Name, establishment year and fees from the ASMI MBBS / BDS lists
master = {'MBBS': load_master(f'{SRC}/AIQ_MBBS.xlsx', 'DEEMED MBBS NRI'),
          'BDS': load_master(f'{SRC}/BDS.xlsx', 'DEEMED NRI')}
for rows, _ in rounds.values():
    for x in rows:
        x.update(establishment=None, fee=None, feeNRI=None)
        course = x['branch'].split()[0]
        if course in master:
            m = master[course][x['code']]  # KeyError = a college missing from the ASMI list; fix the list, don't guess
            x.update(collegeName=m['name'], city=NAME_FIX.get(x['code'], ('', m['city']))[1] or m['city'], establishment=EST_FIX.get(x['code'], m['est']), fee=m['fee'], feeNRI=m['nri'])

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
META = {'round1': ('Round 1', 'Seat Matrix for Round 1 NEET UG MBBS BDS'),
        'round2': ('Round 2', 'Clear Vacancy Round 2 + 30 seats added by MCC Notice 19 (05.09.2026)'),
        'round3': ('Round 3', 'Clear Vacancy Round 3'), 'stray': ('Stray Vacancy', 'Clear Vacancy Stray Vacancy Round')}
index = []
for k, (rows, total) in rounds.items():
    seats = sum(x['seats'] for x in rows)
    expect = total - nursing_seats[k] + (30 if k == 'round2' else 0)
    assert seats == expect, f'{k}: parsed {seats} != source total {expect}'
    json.dump(rows, open(f'{OUT}/{k}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    index.append(dict(id=k, label=META[k][0], source=META[k][1], rows=len(rows), seats=seats))
    print(f'{k}: {len(rows)} rows, {seats} seats (source total {total} - {nursing_seats[k]} nursing{" + 30 added" if k=="round2" else ""}) OK')
json.dump(dict(counselling='MCC', year=2026, rounds=index), open(f'{OUT}/index.json', 'w'), indent=1)

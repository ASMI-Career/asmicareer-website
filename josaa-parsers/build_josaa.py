"""Build public/data/cutoffs/<JOSAA|CSAB>/<year>/{quota}/{category}/{all|female-only}.json from the JoSAA / CSAB
"Opening & Closing Ranks" xlsx (sheet 'All Rounds (...)': Round, Institute, Program, Quota, Seat Type, Gender, Opening, Closing).
Usage: python build_josaa.py SOURCE.xlsx OUT_YEAR_DIR YEAR [JOSAA|CSAB]   (needs openpyxl)"""
import json, os, re, sys, collections, openpyxl

SRC, OUT, YEAR = sys.argv[1], sys.argv[2], int(sys.argv[3])
COUNSELLING = sys.argv[4] if len(sys.argv) > 4 else 'JOSAA'
QUOTA = {'AI': 'all-india', 'HS': 'home-state', 'OS': 'other-state', 'JK': 'jk', 'GO': 'goa', 'LA': 'ladakh',   # JoSAA codes
         'All India': 'all-india', 'Home State': 'home-state', 'Other State': 'other-state', 'OtherState': 'other-state',   # CSAB names
         'Jammu & Kashmir (UT)': 'jk', 'Home State for Goa': 'goa', 'Ladakh (UT)': 'ladakh',
         'DASA-CIWG': 'dasa-ciwg', 'DASA-Non CIWG': 'dasa-non-ciwg'}
def gender_of(g): return 'female-only' if str(g).startswith('Female') else 'all'
NAME_FIX = [(r'Indian\s*Institute\s*of\s*Technology', 'Indian Institute of Technology'),
            (r'Institute\s*of\s*Technology', 'Institute of Technology'),
            (r'National Institute ofTechnology', 'National Institute of Technology')]

def clean(s): return re.sub(r'\s+', ' ', str(s)).strip()

def name_of(raw):
    n = clean(raw)
    n = re.sub(r'Instituteof', 'Institute of', n)
    n = re.sub(r'IndianInstitute', 'Indian Institute', n)
    n = re.sub(r'ofTechnology', 'of Technology', n)
    n = re.sub(r'\s+,', ',', n)
    return n

def type_of(n):
    l = n.lower()
    if re.match(r'^indian institute of technology\b', l): return 'IIT'
    if 'national institute of technology' in l: return 'NIT'
    if re.match(r'^(indian institute of information technology|indian institute of information technology)', l) \
       or l.startswith('pt. dwarka prasad') or l.startswith('atal bihari vajpayee'): return 'IIIT'
    return 'GFTI'

def rank(v):
    s = str(v).strip().rstrip('Pp')          # PwD ranks end in 'P'; some CSAB ranks arrive in scientific notation (1.19904e+006)
    s = re.sub(r'[^0-9.eE+-]', '', s)
    return int(round(float(s))) if s else None

wb = openpyxl.load_workbook(SRC, read_only=True)
rows = list(wb[[n for n in wb.sheetnames if n.startswith('All Rounds')][0]].iter_rows(values_only=True))[1:]
files = collections.defaultdict(dict)   # (quota, cat, gender) -> {(name, program): record}
rounds_seen = set()
for rnd, inst, prog, quota, seat, gender, op, cl in rows:
    if rnd is None: continue
    seat = clean(seat); pwd = '(PwD)' in seat
    cat = re.sub(r'\s*\(PwD\)', '', seat).replace(' ', '')
    n, p = name_of(inst), clean(prog)
    key = (QUOTA[clean(quota)], cat, gender_of(gender))
    rec = files[key].setdefault((n, p), {'name': n, 'program': p, 'type': type_of(n), 'rounds': {}})
    r = rec['rounds'].setdefault('Round %d' % rnd, {})
    rounds_seen.add(int(rnd))
    sfx = '_PWD' if pwd else ''
    r['AIR' + sfx], r['Opening' + sfx] = rank(cl), rank(op)

for (q, cat, g), recs in files.items():
    d = os.path.join(OUT, q, cat); os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, g + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'counselling': COUNSELLING, 'quota': q, 'year': YEAR, 'category': cat, 'gender': g,
                   'colleges': list(recs.values())}, f, separators=(',', ':'), ensure_ascii=False)
print(len(files), 'files; rounds', sorted(rounds_seen), '; records', sum(len(v) for v in files.values()))

"""Build public/data/cutoffs/JOSAA/<year>/{quota}/{category}/{all|female-only}.json from the JoSAA
"Opening & Closing Ranks" xlsx (sheet 'All Rounds (1-5)': Round, Institute, Program, Quota, Seat Type, Gender, Opening, Closing).
Usage: python build_josaa.py SOURCE.xlsx OUT_YEAR_DIR YEAR   (needs openpyxl)"""
import json, os, re, sys, collections, openpyxl

SRC, OUT, YEAR = sys.argv[1], sys.argv[2], int(sys.argv[3])
QUOTA = {'AI': 'all-india', 'HS': 'home-state', 'OS': 'other-state', 'JK': 'jk', 'GO': 'goa', 'LA': 'ladakh'}
GENDER = {'Gender-Neutral': 'all', 'Female-only (including Supernumerary)': 'female-only'}
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
    s = re.sub(r'[^0-9.]', '', str(v))
    return int(float(s)) if s else None

wb = openpyxl.load_workbook(SRC, read_only=True)
rows = list(wb['All Rounds (1-5)'].iter_rows(values_only=True))[1:]
files = collections.defaultdict(dict)   # (quota, cat, gender) -> {(name, program): record}
rounds_seen = set()
for rnd, inst, prog, quota, seat, gender, op, cl in rows:
    if rnd is None: continue
    seat = clean(seat); pwd = '(PwD)' in seat
    cat = re.sub(r'\s*\(PwD\)', '', seat).strip()
    n, p = name_of(inst), clean(prog)
    key = (QUOTA[quota], cat, GENDER[gender])
    rec = files[key].setdefault((n, p), {'name': n, 'program': p, 'type': type_of(n), 'rounds': {}})
    r = rec['rounds'].setdefault('Round %d' % rnd, {})
    rounds_seen.add(int(rnd))
    sfx = '_PWD' if pwd else ''
    r['AIR' + sfx], r['Opening' + sfx] = rank(cl), rank(op)

for (q, cat, g), recs in files.items():
    d = os.path.join(OUT, q, cat); os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, g + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'counselling': 'JOSAA', 'quota': q, 'year': YEAR, 'category': cat, 'gender': g,
                   'colleges': list(recs.values())}, f, separators=(',', ':'), ensure_ascii=False)
print(len(files), 'files; rounds', sorted(rounds_seen), '; records', sum(len(v) for v in files.values()))

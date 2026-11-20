"""Build a self-contained copy of the cutoff app (cutoff list, college page, seat matrix, rank-wise page and all their data)
for a place that can only serve relative links, such as a claude.ai artifact.

Usage: python3 scripts/build_preview_bundle.py <output_dir>
Writes index.html (the cutoff page, without document tags), the other pages, the data files and prints the list of files.
Absolute paths ("/data/...", "/mcc-college.html") become relative; a small script remembers the query string of the
college / rank-wise links in localStorage because a relative page link cannot always carry it.
"""
import json, os, re, shutil, sys

OUT = sys.argv[1]
PUB = 'nextjs-sandbox/public'
os.chdir(PUB)

def rel(s):
    s = re.sub(r'(["\'`])/data/', r'\1data/', s)
    s = s.replace('"/asmi-logo.png"', '"asmi-logo.png"')
    return (s.replace('/mcc-college.html', 'mcc-college.html').replace('/mcc-cutoff.html', 'index.html')
             .replace('/mcc-seat-matrix.html', 'mcc-seat-matrix.html').replace('/mcc-rank-allotment.html', 'mcc-rank-allotment.html'))

CLICK = ('<script>\ndocument.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest(\'a[href^="mcc-college.html?"]\');'
         'if(a){try{localStorage.setItem("asmi_q",a.getAttribute("href").split("?")[1]);}catch(x){}}'
         'var b=e.target.closest&&e.target.closest(\'a[href^="mcc-rank-allotment.html"]\');'
         'if(b){try{localStorage.setItem("asmi_rq",(b.getAttribute("href").split("?")[1])||"");}catch(x){}}},true);\n</script>\n')

def strip_doc(s):
    head = re.search(r'<head>(.*?)</head>', s, re.S).group(1); body = re.search(r'<body[^>]*>(.*)</body>', s, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>', '', head); head = re.sub(r'<meta name="viewport"[^>]*>', '', head)
    return head.strip() + '\n' + body.strip() + '\n'

shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
page = strip_doc(rel(open('mcc-cutoff.html').read())).replace('<title>MCC NEET UG 2026 Cutoff | ASMI Career</title>', '<title>NEET UG 2026 Cutoff</title>')
open(OUT + '/index.html', 'w').write(page + CLICK)
college = rel(open('mcc-college.html').read()).replace('new URLSearchParams(location.search)',
    'new URLSearchParams(location.search||(function(){try{return localStorage.getItem("asmi_q")||""}catch(e){return ""}})())')
open(OUT + '/mcc-college.html', 'w').write(college)
open(OUT + '/mcc-seat-matrix.html', 'w').write(rel(open('mcc-seat-matrix.html').read()).replace('</body>', CLICK + '</body>'))
open(OUT + '/mcc-rank-allotment.html', 'w').write(rel(open('mcc-rank-allotment.html').read()).replace('</body>', CLICK + '</body>'))
shutil.copy('asmi-logo.png', OUT + '/asmi-logo.png')
files = ['mcc-college.html', 'mcc-seat-matrix.html', 'mcc-rank-allotment.html', 'asmi-logo.png']

def put(p):
    os.makedirs(os.path.dirname(f'{OUT}/{p}'), exist_ok=True)
    json.dump(json.load(open(p)), open(f'{OUT}/{p}', 'w'), ensure_ascii=False, separators=(',', ':')); files.append(p)

for t in ('college-index', 'OTHER_QUOTA/all', 'GOVT_MBBS/all', 'GOVT_BDS/all', 'AIIMS_MBBS/all', 'JIPMER_MBBS/all', 'CENTRAL_MBBS/all', 'CENTRAL_BDS/all', 'DEEMED_MBBS/all', 'DEEMED_BDS/all'):
    put(f'data/cutoffs/MCC/2026/{t}.json')
for r in ('round1', 'round2', 'round3', 'stray', 'index'): put(f'data/seat-matrix/MCC/2026/{r}.json')
put('data/allotments/MCC/2026/rankwise.json')
for f in sorted(os.listdir('data/bundles/2026')): put(f'data/bundles/2026/{f}')
total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
print(len(files) + 1, 'files,', total // 1024, 'KB')
json.dump({f: f for f in files}, open(OUT + '/_files.json', 'w'))

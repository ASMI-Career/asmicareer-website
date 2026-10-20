#!/bin/sh
# The MCC pages are built in nextjs-sandbox/public; the live site (Cloudflare "asmicareer-website") publishes the repo root.
# Run this after changing the pages or data there, then commit both places.
set -e
S=nextjs-sandbox/public
cp $S/mcc-cutoff.html $S/mcc-college.html $S/mcc-seat-matrix.html $S/mcc-rank-allotment.html .
mkdir -p neetug2026cutoff $S/neetug2026cutoff
cp $S/mcc-cutoff.html neetug2026cutoff/index.html
cp $S/mcc-cutoff.html $S/neetug2026cutoff/index.html
rm -rf data/cutoffs/MCC/2026 data/seat-matrix/MCC/2026 data/allotments/MCC/2026
mkdir -p data/cutoffs/MCC data/seat-matrix/MCC data/allotments/MCC
cp -r $S/data/cutoffs/MCC/2026 data/cutoffs/MCC/
cp -r $S/data/seat-matrix/MCC/2026 data/seat-matrix/MCC/
cp -r $S/data/allotments/MCC/2026 data/allotments/MCC/

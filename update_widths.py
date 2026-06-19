import re

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update table container
html = html.replace('class="overflow-x-auto scrollbar-thin"', 'class="overflow-x-auto overflow-y-visible scrollbar-thin"')

# 2. Update table width
html = html.replace('class="w-full min-w-[1600px] text-sm"', 'class="w-max min-w-full text-sm"')

# 3. Update EST width
html = re.sub(r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide">Est\.</th>', 
              r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[70px] w-[70px]">Est.</th>', html)

# 4. Update Fees width
html = re.sub(r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide">Fees</th>', 
              r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[100px] w-[100px]">Fees</th>', html)
html = re.sub(r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-\[120px\]\">Fees</th>', 
              r'<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[100px] w-[100px]">Fees</th>', html)
html = html.replace('<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[120px]">Fees</th>', '<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[100px] w-[100px]">Fees</th>')

# 5. Update Intake width (from 80px to 70px)
html = html.replace('min-w-[80px] w-[80px]">Intake', 'min-w-[70px] w-[70px]">Intake')

# 6. Update SML width (from 80px to 70px)
html = html.replace('min-w-[80px] w-[80px]">SML', 'min-w-[70px] w-[70px]">SML')

# 7. Update CSML width
html = html.replace('min-w-[80px] w-[80px]">CSML', 'min-w-[70px] w-[70px]">CSML')

# 8. Update College Name formatting
html = html.replace('min-w-[220px] border-r border-gray-200', 'min-w-[220px] max-w-[260px] whitespace-normal border-r border-gray-200')
html = html.replace('min-w-[220px] border-r border-gray-100', 'min-w-[220px] max-w-[260px] whitespace-normal border-r border-gray-100')

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\devan\Desktop\asmicareer-website\nextjs-sandbox\public\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated widths successfully")

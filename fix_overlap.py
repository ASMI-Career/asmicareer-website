import re

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'r', encoding='utf-8') as f:
    html = f.read()

# For OPEN mode:
# th
html = html.replace(
    '<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] w-auto">College Name</th>',
    '<th rowspan="2" class="sticky left-[120px] z-20 bg-gray-50 px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] border-r border-gray-200 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">College Name</th>',
    1 # Only the first occurrence is OPEN
)
# td
html = html.replace(
    '<td class="px-4 py-4 min-w-[220px] w-auto">\n                  <a href="#" class="font-bold',
    '<td class="sticky left-[120px] z-10 bg-white px-4 py-4 min-w-[220px] border-r border-gray-100 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">\n                  <a href="#" class="font-bold',
    1
)

# For MH mode:
# th
html = html.replace(
    '<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] w-auto">College Name</th>',
    '<th rowspan="2" class="sticky left-[128px] z-20 bg-gray-50 px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] border-r border-gray-200 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">College Name</th>',
    1 # Second occurrence is MH
)
# td
html = html.replace(
    '<td class="px-4 py-4 min-w-[220px] w-auto">\n                  <a href="#" class="font-bold',
    '<td class="sticky left-[128px] z-10 bg-white px-4 py-4 min-w-[220px] border-r border-gray-100 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">\n                  <a href="#" class="font-bold',
    1
)

# For MCC mode:
# th (This is the third and final occurrence)
html = html.replace(
    '<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] w-auto">College Name</th>',
    '<th rowspan="2" class="sticky left-[48px] z-20 bg-gray-50 px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] border-r border-gray-200 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">College Name</th>'
)
# td
html = html.replace(
    '<td class="px-4 py-4 min-w-[220px] w-auto">\n            <a href="#" class="font-bold',
    '<td class="sticky left-[48px] z-10 bg-white px-4 py-4 min-w-[220px] border-r border-gray-100 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">\n            <a href="#" class="font-bold'
)

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\devan\Desktop\asmicareer-website\nextjs-sandbox\public\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Fixed overlap successfully")

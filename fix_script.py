import re

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix 1: Table column widths and un-sticky College Name
# Replace sticky College Name headers
html = re.sub(
    r'<th rowspan="2" class="sticky left-\[[0-9]+px\] z-20 bg-gray-50 px-4 py-4 text-left font-bold uppercase text-xs tracking-wide w-\[[0-9]+px\] shadow-\[.*?\] border-r border-gray-200">College Name</th>',
    '<th rowspan="2" class="px-4 py-4 text-left font-bold uppercase text-xs tracking-wide min-w-[220px] w-auto">College Name</th>',
    html
)
# Replace sticky College Name td
html = re.sub(
    r'<td class="sticky left-\[[0-9]+px\] z-10 bg-white px-4 py-4 w-\[[0-9]+px\] shadow-\[.*?\] border-r border-gray-100">',
    '<td class="px-4 py-4 min-w-[220px] w-auto">',
    html
)

# Set 80px fixed width on Intake, AIR, SML, CSML, PWD headers
html = html.replace('>Intake</th>', ' min-w-[80px] w-[80px]">Intake</th>')
html = html.replace('>AIR</th>', ' min-w-[80px] w-[80px]">AIR</th>')
html = html.replace('>SML</th>', ' min-w-[80px] w-[80px]">SML</th>')
html = html.replace('>CSML</th>', ' min-w-[80px] w-[80px]">CSML</th>')
html = html.replace('>PWD</th>', ' min-w-[80px] w-[80px]">PWD</th>')

# Fix 2: Collapsible Feature Pane
# Change the summary generation to use middle dots
html = html.replace(
    "if (selectedCounselling === 'MCC') summary = `${selectedInstType.replace(/_/g, ' ')}  ${selectedCategory}`;",
    "if (selectedCounselling === 'MCC') summary = `${selectedInstType.replace(/_/g, ' ')} &middot; ${selectedCategory}`;"
)
html = html.replace(
    "else if (selectedCounselling === 'OPEN') summary = `${selectedState}  ${selectedCategory}`;",
    "else if (selectedCounselling === 'OPEN') summary = `${selectedState} &middot; ${selectedCategory}`;"
)
html = html.replace(
    "else if (selectedCounselling === 'MH') summary = `${mhQuota.replace(/_/g, ' ')}  ${mhCategory}  ${mhSubType}`;",
    "else if (selectedCounselling === 'MH') summary = `${mhQuota.replace(/_/g, ' ')} &middot; ${mhCategory} &middot; ${mhSubType}`;"
)

# Fix 3: Token Fetching and DOMContentLoaded
# Find 'const RANK = 25678;' and replace it with 'let RANK = null;'
html = html.replace('const RANK = 25678; // Hardcoded for now', 'let RANK = null;')

# Rewrite initUI and the initialization block
init_block_old = '''    function initUI() {
      renderCounsellingCards();
      renderFilters();
      loadData();
    }'''
    
init_block_new = '''    async function initUI() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      let fetchedRank = null;
      if (token && token.trim() !== '') {
        try {
          const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyL1UC5_EGNPKZcitbkQ38HOnKzgj5ObTZGroPcH0kpyHtjY-SpYYtyl3_jH0-rUR-x/exec';
          const res = await fetch(`${APPS_SCRIPT_URL}?action=getStudent&token=${encodeURIComponent(token)}`);
          const json = await res.json();
          if (json.success && json.data && json.data.neet_rank) {
             fetchedRank = parseInt(json.data.neet_rank);
          }
        } catch(e) {
          console.warn('Rank fetch failed:', e);
        }
      }
      
      RANK = fetchedRank || 25678; // Fallback to 25678 if not found
      
      const rankDisplay = document.querySelector('.text-4xl.font-bold.tracking-tight');
      if (rankDisplay) {
        rankDisplay.textContent = `#${RANK.toLocaleString('en-IN')}`;
      }

      renderCounsellingCards();
      renderFilters();
      loadData();
    }'''

html = html.replace(init_block_old, init_block_new)

# Replace the bottom script execution
bottom_old = '''    searchInput.addEventListener('input', applySearch);

    initUI();
  </script>'''

bottom_new = '''    searchInput.addEventListener('input', applySearch);

    document.addEventListener('DOMContentLoaded', () => {
      initUI();
    });
  </script>'''
html = html.replace(bottom_old, bottom_new)

with open(r'C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\devan\Desktop\asmicareer-website\nextjs-sandbox\public\cutoff_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Success')

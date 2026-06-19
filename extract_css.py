import re
import os

root_dir = r'C:\Users\devan\Desktop\asmicareer-website'
cutoff_path = os.path.join(root_dir, 'cutoff_explorer.html')

with open(cutoff_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Step 1 & 2: Extract style and create dashboard.css
style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
if style_match:
    css = style_match.group(1)
    with open(os.path.join(root_dir, 'dashboard.css'), 'w', encoding='utf-8') as f:
        f.write(css)
    print('Created dashboard.css')

# Remove style from cutoff_explorer.html and add link
html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="/dashboard.css">', html, flags=re.DOTALL)

# Step 3: Replace sidebar HTML
nav_match = re.search(r'<nav class="space-y-2">(.*?)</nav>', html, re.DOTALL)
if nav_match:
    old_nav = nav_match.group(0)
    
    new_nav = '''<nav class="space-y-2">
            <a href="/student" class="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#1A0040] font-medium transition-all group">
              <div class="flex items-center gap-3">
                <iconify-icon icon="lucide:layout-dashboard" class="text-xl text-gray-400 group-hover:text-[#1A0040]"></iconify-icon>
                <span>Dashboard</span>
              </div>
            </a>
            <a href="/predictor" class="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#1A0040] font-medium transition-all group">
              <div class="flex items-center gap-3">
                <iconify-icon icon="lucide:bar-chart-2" class="text-xl text-gray-400 group-hover:text-[#1A0040]"></iconify-icon>
                <span>Predictor</span>
              </div>
            </a>
            <a href="/cutoff_explorer" class="sidebar-active flex items-center justify-between px-4 py-3 rounded-xl transition-all">
              <div class="flex items-center gap-3">
                <iconify-icon icon="lucide:search" class="text-xl"></iconify-icon>
                <span>Cutoff Explorer</span>
              </div>
            </a>
            <a href="/institutes" class="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#1A0040] font-medium transition-all group">
              <div class="flex items-center gap-3">
                <iconify-icon icon="lucide:building-2" class="text-xl text-gray-400 group-hover:text-[#1A0040]"></iconify-icon>
                <span>Institutes</span>
              </div>
            </a>
            <a href="/documents" class="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#1A0040] font-medium transition-all group">
              <div class="flex items-center gap-3">
                <iconify-icon icon="lucide:file-text" class="text-xl text-gray-400 group-hover:text-[#1A0040]"></iconify-icon>
                <span>Documents</span>
              </div>
            </a>
          </nav>'''
          
    html = html.replace(old_nav, new_nav)

# Step 4: Token script
token_script = '''<script>
  (function () {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    function fixLinks() {
      document.querySelectorAll('a[href]').forEach(function (link) {
        try {
          const url = new URL(link.href, window.location.origin);
          if (url.origin === window.location.origin && !url.searchParams.has('token')) {
            url.searchParams.set('token', token);
            link.href = url.toString();
          }
        } catch (e) {}
      });
    }

    // Run immediately
    fixLinks();

    // Run again after any dynamic content loads
    setTimeout(fixLinks, 500);
    setTimeout(fixLinks, 1500);

    // Watch for sidebar links added dynamically
    const observer = new MutationObserver(fixLinks);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
</script>'''

if 'function fixLinks()' not in html:
    html = html.replace('</body>', token_script + '\n</body>')

with open(cutoff_path, 'w', encoding='utf-8') as f:
    f.write(html)
with open(os.path.join(root_dir, 'nextjs-sandbox/public/cutoff_explorer.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated cutoff_explorer.html')

# Generate the other pages
pages = {
    'student.html': 'Dashboard',
    'predictor.html': 'Predictor',
    'institutes.html': 'Institutes',
    'documents.html': 'Documents'
}

for filename, title in pages.items():
    page_html = html.replace('sidebar-active', '') # Remove active class
    
    # Add active class to correct nav item
    # e.g. <a href="/student" class="flex -> <a href="/student" class="sidebar-active flex
    path = f'/{filename.replace(".html", "")}'
    page_html = page_html.replace(f'<a href="{path}" class="flex', f'<a href="{path}" class="sidebar-active flex')
    
    # Clear the table and filters for stub pages
    page_html = re.sub(r'<!-- Filter Container -->.*?</main>', f'</header><main class="p-8"><h1 class="text-2xl font-bold text-[#1A0040]">{title} Content</h1></main>', page_html, flags=re.DOTALL)
    
    with open(os.path.join(root_dir, filename), 'w', encoding='utf-8') as f:
        f.write(page_html)
    print(f'Created {filename}')

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: 'lucide:layout-dashboard' },
  { id: 'predictor',  label: 'Predictor',       icon: 'lucide:bar-chart-3'      },
  { id: 'cutoff',     label: 'Cutoff Explorer', icon: 'lucide:search'           },
  { id: 'institutes', label: 'Institutes',      icon: 'lucide:building-2'       },
  { id: 'checklist',  label: 'Documents',       icon: 'lucide:file-text'        },
];
export default function Shell(props) {
  const { children, activeTab, initials, setActiveTab, sidebarCollapsed, studentName, toggleSidebar } = props;

  return (
    <div className="student-body">
      <div className="dashboard-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-logo">
            <img src="/asmi-logo.png" alt="ASMI Logo" className="logo-img" />
          </div>

          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link${activeTab === 'dashboard' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:layout-dashboard" className="nav-icon"></iconify-icon>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('predictor')}
              className={`nav-link${activeTab === 'predictor' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:bar-chart-3" className="nav-icon"></iconify-icon>
              <span>Predictor</span>
            </button>

            <button
              onClick={() => { window.location.href = '/cutoff_explorer.html' + window.location.search; }}
              className={`nav-link${activeTab === 'cutoff' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:search" className="nav-icon"></iconify-icon>
              <span>Cutoff Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('institutes')}
              className={`nav-link${activeTab === 'institutes' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:building-2" className="nav-icon"></iconify-icon>
              <span>Institutes</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`nav-link${activeTab === 'checklist' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:file-text" className="nav-icon"></iconify-icon>
              <span>Documents</span>
            </button>

            <div className="nav-section-label" style={{marginTop: '24px'}}>Account</div>

            <button className="nav-link">
              <iconify-icon icon="lucide:settings" className="nav-icon"></iconify-icon>
              <span>Settings</span>
            </button>

            <button className="nav-link">
              <iconify-icon icon="lucide:help-circle" className="nav-icon"></iconify-icon>
              <span>Help &amp; Support</span>
            </button>

            <button onClick={toggleSidebar} className="nav-link sidebar-toggle-btn" style={{ marginTop: 16 }}>
              <iconify-icon icon={sidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'} className="nav-icon"></iconify-icon>
              <span>Collapse</span>
            </button>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>

          {/* Top Header */}
          <header className="dashboard-header">
            <div className="header-search">
              <span className="header-search-icon">⊕</span>
              <input type="text" placeholder="Search for colleges, cutoffs or help..." />
            </div>
            <div className="header-right">
              <div className="header-user">
                <div className="header-user-info">
                  <div className="header-user-name">{studentName}</div>
                  <div className="header-user-role">NEET Aspirant 2026</div>
                </div>
                <div className="user-avatar">{initials}</div>
              </div>
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <div className="page-content">
            {children}
          </div>{/* /page-content */}
        </div>{/* /main-content */}

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => {
              if (item.id === 'cutoff') {
                window.location.href = '/cutoff_explorer.html' + window.location.search;
              } else {
                setActiveTab(item.id);
              }
            }}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}>
              <iconify-icon icon={item.icon} className="nav-icon"></iconify-icon>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>{/* /dashboard-shell */}
    </div>
  );
}

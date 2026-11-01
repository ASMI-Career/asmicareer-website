export default function Shell(props) {
  const { config, children, activeTab, initials, setActiveTab, sidebarCollapsed, studentName, toggleSidebar } = props;

  // Only the modules this stream has appear in the menus.
  const navItems = config.nav.filter(item => config.modules.includes(item.id));

  return (
    <div className="student-body">
      <div className="dashboard-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-logo">
            <img src="/asmi-logo.png" alt="ASMI Logo" className="logo-img" />
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={item.externalHref
                  ? () => { window.location.href = item.externalHref + window.location.search; }
                  : () => setActiveTab(item.id)}
                className={`nav-link${activeTab === item.id ? ' active' : ''}`}
              >
                <iconify-icon icon={item.icon} className="nav-icon"></iconify-icon>
                <span>{item.label}</span>
              </button>
            ))}

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
                  <div className="header-user-role">{config.dashboard.headerRole}</div>
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
          {navItems.map(item => (
            <button key={item.id} onClick={() => {
              if (item.externalHref) {
                window.location.href = item.externalHref + window.location.search;
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

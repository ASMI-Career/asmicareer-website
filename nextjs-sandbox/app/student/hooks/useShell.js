import { useState, useEffect } from 'react';

export default function useShell() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);

      if (localStorage.getItem('sidebar_collapsed')) setSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar_collapsed', next ? '1' : '');
  };

  return { activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed, toggleSidebar };
}

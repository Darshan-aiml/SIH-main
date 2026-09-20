import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { dashboardApi } from '../services/api';
import {
  LayoutDashboard, FolderOpen, Shield, Brain, Link2,
  Blocks, ClipboardList, Users, Settings, LogOut, Search,
  Bell, ChevronLeft, ChevronRight, Fingerprint, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/evidence', icon: Shield, label: 'Evidence Vault' },
  { to: '/blockchain', icon: Blocks, label: 'Blockchain' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Logs' },
  { to: '/users', icon: Users, label: 'Users' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await dashboardApi.search(searchQuery);
      setSearchResults(res.data);
      setShowSearch(true);
    } catch { /* ignore */ }
  };

  const roleColor: Record<string, string> = {
    ADMIN: 'text-red-400',
    INVESTIGATOR: 'text-blue-400',
    FORENSIC_OFFICER: 'text-emerald-400',
    LEGAL_OFFICER: 'text-amber-400',
    AUDITOR: 'text-purple-400',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300 glass border-r border-dark-700/50 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-dark-700/50">
          <Fingerprint className="w-8 h-8 text-vault-500 flex-shrink-0" />
          {!collapsed && (
            <div className="ml-3 animate-fade-in">
              <h1 className="text-base font-bold text-white tracking-tight">EvidenceVault</h1>
              <p className="text-[10px] text-dark-400 uppercase tracking-widest">Secure • Verified • Trusted</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-vault-600/20 text-vault-400 border border-vault-600/30 shadow-lg shadow-vault-600/10'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                }`
              }
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-dark-700/50 text-dark-400 hover:text-dark-200 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 glass border-b border-dark-700/50 flex items-center px-6 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search evidence, cases, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-vault-600/50 focus:ring-1 focus:ring-vault-600/25 transition-all"
            />
            {/* Search Results Dropdown */}
            {showSearch && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card p-4 z-50 max-h-80 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-dark-400 uppercase tracking-wider">Search Results</span>
                  <button onClick={() => setShowSearch(false)} className="text-dark-500 hover:text-dark-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {searchResults.cases?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-vault-400 font-semibold mb-1">Cases</p>
                    {searchResults.cases.map((c: any) => (
                      <button key={c.id} onClick={() => { navigate(`/cases/${c.id}`); setShowSearch(false); }}
                        className="block w-full text-left px-2 py-1.5 rounded text-sm text-dark-300 hover:bg-dark-800/50">
                        <span className="text-vault-400 font-mono text-xs">{c.case_number}</span> {c.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.evidence?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-cyber-400 font-semibold mb-1">Evidence</p>
                    {searchResults.evidence.map((e: any) => (
                      <button key={e.id} onClick={() => { navigate(`/evidence/${e.id}`); setShowSearch(false); }}
                        className="block w-full text-left px-2 py-1.5 rounded text-sm text-dark-300 hover:bg-dark-800/50">
                        <span className="text-cyber-400 font-mono text-xs">{e.evidence_id}</span> {e.filename}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.people?.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 font-semibold mb-1">People</p>
                    {searchResults.people.map((p: any) => (
                      <div key={p.id} className="px-2 py-1.5 text-sm text-dark-300">
                        {p.name} <span className="text-dark-500 text-xs">({p.role})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-dark-400 hover:text-dark-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User */}
            <div className="flex items-center gap-3 pl-3 border-l border-dark-700">
              <div className="text-right">
                <p className="text-sm font-medium text-dark-200">{user?.full_name}</p>
                <p className={`text-xs font-semibold ${roleColor[user?.role || ''] || 'text-dark-400'}`}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-vault-600/30 border border-vault-500/30 flex items-center justify-center">
                <span className="text-sm font-bold text-vault-400">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <button onClick={logout} className="p-2 text-dark-500 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

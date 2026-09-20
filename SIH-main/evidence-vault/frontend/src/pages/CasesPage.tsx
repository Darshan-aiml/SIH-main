import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseApi } from '../services/api';
import type { Case } from '../types';
import { FolderOpen, Plus, Search, Filter, ChevronRight, Shield } from 'lucide-react';

const priorityColors: Record<string, string> = {
  CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low',
};
const statusColors: Record<string, string> = {
  OPEN: 'badge-pending', UNDER_INVESTIGATION: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  CLOSED: 'bg-dark-600/30 text-dark-400 border border-dark-500/30',
};

export default function CasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', case_type: 'GENERAL', priority: 'MEDIUM' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    caseApi.list({ search: search || undefined } as any)
      .then((r) => setCases(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await caseApi.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', case_type: 'GENERAL', priority: 'MEDIUM' });
      load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-blue-400" /> Case Management
          </h1>
          <p className="text-dark-400 text-sm mt-1">{cases.length} cases in system</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Case
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cases..."
          className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-vault-600/50" />
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-vault-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
              className="glass-card p-5 text-left hover-lift group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-vault-400">{c.case_number}</span>
                <span className={`badge ${priorityColors[c.priority] || 'badge-low'}`}>{c.priority}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-vault-300 transition-colors line-clamp-2">
                {c.title}
              </h3>
              <p className="text-xs text-dark-400 line-clamp-2 mb-4">{c.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${statusColors[c.status] || 'badge-pending'}`}>{c.status.replace('_', ' ')}</span>
                  <span className="flex items-center gap-1 text-xs text-dark-500">
                    <Shield className="w-3 h-3" /> {c.evidence_count}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-vault-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Case</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required className="w-full px-3 py-2 bg-dark-800/50 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-vault-500" />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 bg-dark-800/50 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-vault-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Type</label>
                  <select value={form.case_type} onChange={(e) => setForm({ ...form, case_type: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-dark-600 rounded-lg text-sm text-white focus:outline-none">
                    {['GENERAL', 'MISSING_PERSON', 'FINANCIAL_FRAUD', 'CYBER_CRIME', 'HOMICIDE', 'THEFT', 'NARCOTICS'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-dark-600 rounded-lg text-sm text-white focus:outline-none">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary text-sm">
                  {creating ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

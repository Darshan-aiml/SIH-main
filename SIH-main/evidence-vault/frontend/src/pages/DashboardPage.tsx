import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';
import {
  FolderOpen, Shield, CheckCircle, Clock, Blocks,
  Plus, Upload, Link2, ClipboardList, TrendingUp, Activity, KeyRound
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-vault-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Cases', value: stats.total_cases, icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Evidence', value: stats.total_evidence, icon: Shield, color: 'text-vault-400', bg: 'bg-vault-500/10', border: 'border-vault-500/20' },
    { label: 'Verified Evidence', value: stats.verified_evidence, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Pending Review', value: stats.pending_review, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Custody Transfers', value: stats.custody_transfers || 0, icon: Link2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Blockchain Blocks', value: stats.blockchain_blocks, icon: Blocks, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  ];


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-dark-400 text-sm mt-1">Evidence Management Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/cases')} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Case
          </button>
          <button onClick={() => navigate('/evidence')} className="btn-primary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload Evidence
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`glass-card p-4 hover-lift ${s.border} border`}>
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-dark-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-vault-400" /> Evidence Upload Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.evidence_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Evidence by Category */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">Evidence by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.evidence_by_category} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} dataKey="value" nameKey="name"
                stroke="none" label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.evidence_by_category.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Case Status */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.case_status_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">AI Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.risk_distribution} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} dataKey="value" nameKey="name"
                stroke="none" label={({ name, value }) => `${name}: ${value}`}
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity (Full Width - High Risk Alerts Removed) */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-400" /> Recent Evidence & Case Activity
            </h3>
            <p className="text-xs text-dark-400 mt-0.5">Chronological record of evidence creation, custody transfers, and integrity checks</p>
          </div>
          <button
            onClick={() => navigate('/login-activity')}
            className="inline-flex items-center gap-1.5 text-xs text-vault-400 hover:text-vault-300 font-medium px-3 py-1.5 rounded-lg bg-vault-600/10 border border-vault-500/20 hover:bg-vault-600/20 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>View Officer Login History →</span>
          </button>
        </div>

        {stats.recent_activity.length === 0 ? (
          <p className="text-xs text-dark-500 py-6 text-center">No recent operational activities recorded.</p>
        ) : (
          <div className="divide-y divide-dark-800/60">
            {stats.recent_activity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 py-3 hover:bg-dark-800/30 px-3 rounded-lg transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.status === 'SUCCESS' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-vault-400 text-xs font-semibold">{a.action}</span>
                    {a.resource && (
                      <>
                        <span className="text-dark-600">•</span>
                        <span className="text-dark-300 text-xs font-medium">{a.resource}</span>
                      </>
                    )}
                    <span className="ml-auto text-xs text-dark-500">
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-0.5 flex items-center gap-2">
                    <span>Officer: <strong className="text-dark-300 font-medium">{a.user || 'System'}</strong></span>
                    <span className={`badge text-[10px] px-1.5 py-0.5 ${a.status === 'SUCCESS' ? 'badge-verified' : 'badge-tampered'}`}>
                      {a.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-300 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Create Case', icon: Plus, action: () => navigate('/cases'), color: 'text-blue-400' },
            { label: 'Upload Evidence', icon: Upload, action: () => navigate('/evidence'), color: 'text-vault-400' },
            { label: 'Verify Blockchain', icon: Blocks, action: () => navigate('/blockchain'), color: 'text-cyan-400' },
            { label: 'View Audit Logs', icon: ClipboardList, action: () => navigate('/audit'), color: 'text-amber-400' },
          ].map((qa) => (
            <button key={qa.label} onClick={qa.action}
              className="flex items-center gap-3 p-4 rounded-lg bg-dark-800/30 hover:bg-dark-800/60 border border-dark-700/50 transition-all">
              <qa.icon className={`w-5 h-5 ${qa.color}`} />
              <span className="text-sm text-dark-300">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

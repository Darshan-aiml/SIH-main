import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { authApi } from '../services/api';
import { Fingerprint, Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e: string) => {
    setEmail(e);
    setPassword('demo123');
  };

  const demoUsers = [
    { email: 'admin@evidencevault.local', role: 'ADMIN', color: 'text-red-400' },
    { email: 'investigator@evidencevault.local', role: 'INVESTIGATOR', color: 'text-blue-400' },
    { email: 'forensic@evidencevault.local', role: 'FORENSIC', color: 'text-emerald-400' },
    { email: 'legal@evidencevault.local', role: 'LEGAL', color: 'text-amber-400' },
    { email: 'auditor@evidencevault.local', role: 'AUDITOR', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-vault-950 to-dark-900 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-vault-500 font-mono text-xs whitespace-nowrap"
              style={{ top: `${i * 5}%`, left: `${(i * 17) % 100}%`, transform: `rotate(${i * 3}deg)` }}>
              {`SHA256:${Array.from({length: 8}, () => Math.random().toString(16).substr(2, 8)).join('')}`}
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-vault-600/20 border border-vault-500/30 flex items-center justify-center">
              <Fingerprint className="w-9 h-9 text-vault-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">EvidenceVault</h1>
              <p className="text-vault-400 text-sm tracking-widest uppercase mt-1">Secure Document Management</p>
            </div>
          </div>
          <p className="text-xl text-dark-300 leading-relaxed max-w-lg">
            Cryptographically secured evidence management platform for law enforcement, 
            forensic teams, and legal professionals.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {['SHA-256 Hashing', 'AES Encryption', 'Blockchain Ledger', 'AI Intelligence',
              'Chain of Custody', 'Role-Based Access'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-dark-400 text-sm">
                <Shield className="w-4 h-4 text-vault-500" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-xs text-dark-600">
            Smart India Hackathon 2026 • SIH26190 • Blockchain & Cybersecurity
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Fingerprint className="w-12 h-12 text-vault-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">EvidenceVault</h1>
          </div>

          <div className="glass-card p-8">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-vault-500" />
              <h2 className="text-xl font-semibold text-white">Secure Login</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@evidencevault.local" required
                  className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/25 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••" required
                    className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/25 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-primary py-3 text-center disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Authenticate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick login */}
          <div className="mt-6 glass-card p-4">
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-3">Demo Quick Login</p>
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((u) => (
                <button key={u.email} onClick={() => quickLogin(u.email)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-800/30 hover:bg-dark-800/60 border border-dark-700/50 transition-all text-left">
                  <span className="text-xs text-dark-400 truncate">{u.email}</span>
                  <span className={`text-xs font-semibold ${u.color}`}>{u.role}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-dark-600 mt-2 text-center">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

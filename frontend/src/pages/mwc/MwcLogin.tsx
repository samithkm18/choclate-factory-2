import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MwcLogin: React.FC = () => {
  const { mwcLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user.role === 'mwc') {
          mwcLogin(data.token, data.user);
          navigate('/mwc/dashboard');
        } else {
          setError('Access denied. Restricted to MWC Developer credentials.');
        }
      } else {
        setError(data.message || 'Verification failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to maintenance services failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-6 font-sans text-white">
      <div className="bg-zinc-950 border-2 border-emerald-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Terminal size={24} />
          </div>
          <h2 className="text-2xl font-serif text-emerald-400 uppercase font-semibold">MWC SYSTEM TERMINAL</h2>
          <p className="text-xs text-zinc-500 font-mono">Developer/Maintenance Authorization Protocol Required.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-lg text-xs font-semibold text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left font-mono">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Developer E-Mail</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="e.g. mwc@manis.com"
                className="w-full bg-zinc-900 border border-emerald-500/20 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
              />
              <Mail className="absolute left-3 top-3.5 text-zinc-600" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Passkey Word</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-zinc-900 border border-emerald-500/20 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
              />
              <Lock className="absolute left-3 top-3.5 text-zinc-600" size={14} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Validating Token...' : <><LogIn size={14} /> Execute Auth Init</>}
          </button>
        </form>

        <div className="text-center border-t border-zinc-800 pt-4 text-xs text-zinc-600">
          <Link to="/" className="text-emerald-500 hover:underline font-mono text-[10px] uppercase tracking-wider">
            ← Abort Protocol (Return Store)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MwcLogin;

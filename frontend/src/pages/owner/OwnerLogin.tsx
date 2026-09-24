import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

export const OwnerLogin: React.FC = () => {
  const { ownerLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('kotefactory@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user && data.user.role === 'owner') {
          ownerLogin(data.token, data.user);
          navigate('/owner/dashboard');
          return;
        } else {
          setError('Access restricted. Account lacks Owner authorization.');
        }
      } else {
        if (res.status === 401) {
          setError('Invalid email or password. Please verify credentials.');
        } else if (res.status === 403) {
          setError(data.message || 'Account disabled. Contact system administrator.');
        } else if (res.status === 429) {
          setError('Too many login attempts. Please try again in a few minutes.');
        } else {
          setError(data.message || 'Authentication failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network connection failed. Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 md:py-32 px-4 md:px-6 font-sans text-white">
      <div className="bg-brand-panelBg border-2 border-brand-gold/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-gold/10 border border-brand-gold/30 rounded-full flex items-center justify-center mx-auto text-brand-gold">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-brand-goldLight uppercase font-semibold">OWNER CELLAR GATE</h2>
          <p className="text-xs text-zinc-400">Restricted portal for Mani Sales International Owner.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-lg text-xs font-semibold text-center animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Owner Email</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="kotefactory@gmail.com"
                className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
              />
              <Mail className="absolute left-3 top-3.5 text-zinc-500" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Owner Password</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
              />
              <Lock className="absolute left-3 top-3.5 text-zinc-500" size={14} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : <><LogIn size={14} /> Unlock Owner Dashboard</>}
          </button>
        </form>

        <div className="text-center border-t border-brand-maroon/10 pt-4 text-xs text-zinc-500">
          <Link to="/" className="text-brand-gold hover:underline font-semibold text-[10px] uppercase tracking-wider">
            ← Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;

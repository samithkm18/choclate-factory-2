import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const UserLogin: React.FC = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

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
        userLogin(data.token, data.user);
        if (redirect === 'checkout') {
          navigate('/checkout');
        } else {
          navigate('/account');
        }
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed. Is server active?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-6 font-sans text-white">
      <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif text-brand-goldLight uppercase font-semibold">GUEST LOG IN</h2>
          <p className="text-xs text-zinc-400">Unlock your personal customized collections.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-lg text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="e.g. user@manis.com"
                className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
              />
              <Mail className="absolute left-3 top-3.5 text-zinc-500" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Secure Password</label>
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
            className="w-full py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow transition-all duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : <><LogIn size={14} /> Enter Guest Room</>}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-600 text-[9px] uppercase tracking-wider font-extrabold">or</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
          className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center border-t border-brand-maroon/10 pt-4 text-xs text-zinc-500">
          <span>First time visitor? </span>
          <Link to="/register" className="text-brand-gold hover:underline font-semibold flex items-center justify-center gap-1 mt-1">
            Register Guest Account <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;

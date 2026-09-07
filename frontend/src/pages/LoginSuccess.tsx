import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const LoginSuccess: React.FC = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (token && name && email) {
      // Authenticate inside global React Auth state
      userLogin(token, { id: 0, name, email, role: 'user' });
      
      // Smoothly redirect to account page or checkout after 1.5s
      const timer = setTimeout(() => {
        const redirect = localStorage.getItem('manis_oauth_redirect');
        if (redirect === 'checkout') {
          localStorage.removeItem('manis_oauth_redirect');
          navigate('/checkout');
        } else {
          navigate('/account');
        }
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Auth parameters missing, send to login
      navigate('/login?error=oauth_missing_parameters');
    }
  }, [searchParams, userLogin, navigate]);

  const userName = searchParams.get('name') || 'Guest';

  return (
    <div className="max-w-md mx-auto py-32 px-6 font-sans text-center text-white">
      <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-gold animate-spin" />
          <h2 className="text-2xl font-serif text-brand-goldLight uppercase tracking-wider">
            Google Identity Verified
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Welcome back, <span className="text-white font-semibold">{userName}</span>.<br />
            Synchronizing your luxury reserve collections...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccess;

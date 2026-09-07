import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'owner' | 'mwc';
}

interface AuthContextType {
  user: User | null;
  owner: User | null;
  mwc: User | null;
  userToken: string | null;
  ownerToken: string | null;
  mwcToken: string | null;
  userLogin: (token: string, user: User) => void;
  ownerLogin: (token: string, user: User) => void;
  mwcLogin: (token: string, user: User) => void;
  userLogout: () => void;
  ownerLogout: () => void;
  mwcLogout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [mwc, setMwc] = useState<User | null>(null);

  const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('user_token'));
  const [ownerToken, setOwnerToken] = useState<string | null>(localStorage.getItem('owner_token'));
  const [mwcToken, setMwcToken] = useState<string | null>(localStorage.getItem('mwc_token'));
  
  const [loading, setLoading] = useState(true);

  // Validate sessions on start
  useEffect(() => {
    const validateSessions = async () => {
      setLoading(true);
      
      // Validate User Token
      if (userToken) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            userLogout();
          }
        } catch (e) {
          console.error('Error validating user token:', e);
        }
      }

      // Validate Owner Token
      if (ownerToken) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user.role === 'owner') {
              setOwner(data.user);
            } else {
              ownerLogout();
            }
          } else {
            ownerLogout();
          }
        } catch (e) {
          console.error('Error validating owner token:', e);
        }
      }

      // Validate MWC Token
      if (mwcToken) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${mwcToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user.role === 'mwc') {
              setMwc(data.user);
            } else {
              mwcLogout();
            }
          } else {
            mwcLogout();
          }
        } catch (e) {
          console.error('Error validating mwc token:', e);
        }
      }

      setLoading(false);
    };

    validateSessions();
  }, [userToken, ownerToken, mwcToken]);

  const userLogin = (token: string, userData: User) => {
    localStorage.setItem('user_token', token);
    setUserToken(token);
    setUser(userData);
  };

  const ownerLogin = (token: string, ownerData: User) => {
    localStorage.setItem('owner_token', token);
    setOwnerToken(token);
    setOwner(ownerData);
  };

  const mwcLogin = (token: string, mwcData: User) => {
    localStorage.setItem('mwc_token', token);
    setMwcToken(token);
    setMwc(mwcData);
  };

  const userLogout = () => {
    localStorage.removeItem('user_token');
    setUserToken(null);
    setUser(null);
  };

  const ownerLogout = () => {
    localStorage.removeItem('owner_token');
    setOwnerToken(null);
    setOwner(null);
  };

  const mwcLogout = () => {
    localStorage.removeItem('mwc_token');
    setMwcToken(null);
    setMwc(null);
  };

  return (
    <AuthContext.Provider value={{
      user, owner, mwc,
      userToken, ownerToken, mwcToken,
      userLogin, ownerLogin, mwcLogin,
      userLogout, ownerLogout, mwcLogout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;

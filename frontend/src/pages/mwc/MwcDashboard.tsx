import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Users, ClipboardList, LogOut, Terminal,
  Cpu, HardDrive, Clock, Check, Megaphone, Star, Layers, Languages, BookOpen, Tag, MapPin, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminProducts from '../../components/admin/AdminProducts';
import AdminReviews from '../../components/admin/AdminReviews';
import AdminPosters from '../../components/admin/AdminPosters';
import AdminAbout from '../../components/admin/AdminAbout';
import AdminTranslations from '../../components/admin/AdminTranslations';
import AdminCoupons from '../../components/admin/AdminCoupons';
import AdminLocations from '../../components/admin/AdminLocations';
import { getAssetUrl } from '../../config/api';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'owner' | 'mwc';
  status: 'active' | 'disabled';
  created_at: string;
}

interface AuditLog {
  id: number;
  operator_name: string | null;
  operator_email: string | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  is_spotlight: number;
}

interface SystemHealth {
  status: string;
  uptime: number;
  memory: { rss: string; heapTotal: string; heapUsed: string };
  cpu: { user: number; system: number };
  database: { size: string; path: string };
  nodeVersion: string;
  platform: string;
}

export const MwcDashboard: React.FC = () => {
  const { mwc, mwcToken, mwcLogout } = useAuth();
  const navigate = useNavigate();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'orders' | 'products' | 'reviews' | 'posters' | 'about' | 'translations' | 'cms' | 'audit' | 'activity' | 'settings' | 'coupons' | 'locations'>('health');
  
  // Data states
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mwcLogs, setMwcLogs] = useState<AuditLog[]>([]);
  const [bannerInput, setBannerInput] = useState('');
  const [spotlightId, setSpotlightId] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sInstagram, setSInstagram] = useState('');
  const [sInstructions, setSInstructions] = useState('');
  const [sQrUrl, setSQrUrl] = useState('');
  const [sQrFile, setSQrFile] = useState<File | null>(null);
  const [sLogoFile, setSLogoFile] = useState<File | null>(null);
  const [sLogoUrl, setSLogoUrl] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Redirect if unauthorized
  useEffect(() => {
    if (!mwcToken) {
      navigate('/mwc/login');
    }
  }, [mwcToken, navigate]);

  // Load all developer tab details
  useEffect(() => {
    if (!mwcToken) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${mwcToken}` };

        // 1. Fetch System Health
        const resHealth = await fetch('http://localhost:5000/api/mwc/health', { headers });
        if (resHealth.ok) setHealth(await resHealth.json());

        // 2. Fetch Users List
        const resUsers = await fetch('http://localhost:5000/api/mwc/users', { headers });
        if (resUsers.ok) setUsers(await resUsers.json());

        // 2.5 Fetch Orders List
        const resOrders = await fetch('http://localhost:5000/api/mwc/orders', { headers });
        if (resOrders.ok) setOrders(await resOrders.json());

        // 3. Fetch Audit Logs
        const resLogs = await fetch('http://localhost:5000/api/mwc/audit-logs', { headers });
        if (resLogs.ok) setAuditLogs(await resLogs.json());

        // 3.5 Fetch MWC Activity Logs
        const resMwcLogs = await fetch('http://localhost:5000/api/mwc/activity-logs', { headers });
        if (resMwcLogs.ok) setMwcLogs(await resMwcLogs.json());

        // 4. Fetch Products (for spotlight choice)
        const resProducts = await fetch('http://localhost:5000/api/products');
        if (resProducts.ok) {
          const p = await resProducts.json();
          setProducts(p);
          const spotlight = p.find((item: any) => item.is_spotlight === 1);
          if (spotlight) setSpotlightId(spotlight.id.toString());
        }

        // 5. Fetch current Settings
        const resSettings = await fetch('http://localhost:5000/api/mwc/settings', { headers });
        if (resSettings.ok) {
          const s = await resSettings.json();
          setBannerInput(s.announcement_banner || '');
          setSPhone(s.contact_phone || '');
          setSEmail(s.contact_email || '');
          setSAddress(s.contact_address || '');
          setSInstagram(s.instagram_username || '');
          setSInstructions(s.payment_instructions || '');
          setSQrUrl(s.payment_qr_code || '');
          setSLogoUrl(s.brand_logo_url || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mwcToken]);

  // Modify user roles (promote/demote)
  const handleUpdateRole = async (targetUserId: number, role: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: role as any } : u));
        alert('User authorization role updated successfully.');
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active/disabled account state
  const handleToggleStatus = async (targetUserId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/users/${targetUserId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, status: nextStatus } : u));
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOrderPayment = async (orderId: string) => {
    if (!confirm(`Confirm payment received for order #${orderId}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/orders/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mwcToken}`
        }
      });

      if (res.ok) {
        // Reload orders
        const headers = { 'Authorization': `Bearer ${mwcToken}` };
        const resOrders = await fetch('http://localhost:5000/api/mwc/orders', { headers });
        if (resOrders.ok) setOrders(await resOrders.json());
        alert('Order payment confirmed. Order status is now Preparing.');
      } else {
        const err = await res.json();
        alert(`Error confirming payment: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOrderPayment = async (orderId: string) => {
    const reason = prompt('Please enter the reason for rejecting order payment:', 'UTR reference could not be verified on our bank account.');
    if (reason === null) return;
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/orders/${orderId}/reject-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        // Reload orders
        const headers = { 'Authorization': `Bearer ${mwcToken}` };
        const resOrders = await fetch('http://localhost:5000/api/mwc/orders', { headers });
        if (resOrders.ok) setOrders(await resOrders.json());
        alert('Order payment manually rejected. Order status updated to Cancelled.');
      } else {
        const err = await res.json();
        alert(`Error rejecting payment: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save CMS banner and spotlight changes
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/mwc/announcement', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({
          announcement_banner: bannerInput,
          spotlight_product_id: parseInt(spotlightId)
        })
      });

      if (res.ok) {
        alert('Site announcement and hero spotlight configuration updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/mwc/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mwcToken}`
        },
        body: JSON.stringify({
          contact_phone: sPhone,
          contact_email: sEmail,
          contact_address: sAddress,
          instagram_username: sInstagram,
          payment_instructions: sInstructions
        })
      });

      if (res.ok) {
        alert('Concierge settings updated successfully.');
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sLogoFile) return;

    const formData = new FormData();
    formData.append('logo', sLogoFile);

    try {
      const res = await fetch('http://localhost:5000/api/mwc/settings/logo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${mwcToken}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        alert('Brand logo uploaded and updated.');
        setSLogoUrl(data.url);
        setSLogoFile(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Error uploading logo.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sQrFile) return;

    const formData = new FormData();
    formData.append('logo', sQrFile);

    try {
      const res = await fetch('http://localhost:5000/api/mwc/settings/qr', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${mwcToken}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        alert('Payment QR code image uploaded and updated successfully!');
        setSQrUrl(data.url);
        setSQrFile(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Error uploading payment QR code.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-zinc-950 text-emerald-400 font-mono">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-bold">Accessing Maintenance Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono flex flex-col md:flex-row text-left">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col justify-between gap-6">
        <div className="space-y-8">
          <div className="flex flex-col border-b border-zinc-800 pb-4">
            <span className="text-base font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Terminal size={18} /> MWC CONSOLE
            </span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">
              Developer Node v2.0
            </span>
          </div>

          <nav className="flex flex-col gap-2.5 text-xs uppercase tracking-wider font-semibold">
            <button 
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'health' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Activity size={15} /> System Health
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Users size={15} /> User Roles
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <ClipboardList size={15} /> Order Queue
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Layers size={15} /> Chocolate CRUD
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'reviews' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Star size={15} /> Review Queue
            </button>
            <button 
              onClick={() => setActiveTab('posters')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'posters' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Layers size={15} /> Flyer Gallery
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'about' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <BookOpen size={15} /> Heritage Page
            </button>
            <button 
              onClick={() => setActiveTab('translations')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'translations' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Languages size={15} /> Language Editor
            </button>
            <button 
              onClick={() => setActiveTab('cms')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'cms' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Megaphone size={15} /> Site CMS banner
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Settings size={15} /> Brand Settings
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'activity' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Terminal size={15} /> Developer Logs
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <ClipboardList size={15} /> Audit Log traces
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'coupons' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <Tag size={15} /> Promo Codes
            </button>
            <button 
              onClick={() => setActiveTab('locations')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'locations' ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'}`}
            >
              <MapPin size={15} /> Map Locations
            </button>
          </nav>
        </div>

        <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
          <div className="text-left text-[10px]">
            <p className="text-zinc-300 font-semibold leading-tight">{mwc?.name}</p>
            <p className="text-zinc-600 uppercase tracking-wider">Developer role</p>
          </div>
          <button 
            onClick={() => { mwcLogout(); navigate('/mwc/login'); }}
            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto max-h-screen">
        
        {/* TAB 1: System Health Uptime (Uptime diagnostics) */}
        {activeTab === 'health' && health && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" /> SYSTEM DIAGNOSTICS LOG
            </h2>

            {/* Health parameters grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold flex items-center gap-1"><Cpu size={12} /> CPU Usage</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">Active: (Healthy)</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold flex items-center gap-1"><HardDrive size={12} /> Database Size</span>
                <span className="text-lg font-bold text-white mt-1 block">{health.database.size}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold flex items-center gap-1"><Clock size={12} /> API Uptime</span>
                <span className="text-lg font-bold text-white mt-1 block">{formatUptime(health.uptime)}</span>
              </div>
            </div>

            {/* Detailed memory allocation specs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Node Process Environment</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400">
                <div className="space-y-2">
                  <p><span className="text-zinc-600">Engine Version:</span> {health.nodeVersion}</p>
                  <p><span className="text-zinc-600">Runtime OS:</span> {health.platform}</p>
                  <p><span className="text-zinc-600">Status Claim:</span> <span className="text-emerald-400">ONLINE</span></p>
                </div>
                <div className="space-y-2">
                  <p><span className="text-zinc-600">RAM Reserved (RSS):</span> {health.memory.rss}</p>
                  <p><span className="text-zinc-600">Heap Total Allocated:</span> {health.memory.heapTotal}</p>
                  <p><span className="text-zinc-600">Heap In Use:</span> {health.memory.heapUsed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: User manager role controls */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white">USER SYSTEM ROLE MATRIX</h2>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Current Role</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-zinc-900 hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <p className="font-semibold text-white leading-tight">{u.name}</p>
                          <p className="text-[9px] text-zinc-500">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <select
                            value={u.role}
                            disabled={u.id === mwc?.id}
                            onChange={e => handleUpdateRole(u.id, e.target.value)}
                            className="bg-zinc-950 text-zinc-300 text-[10px] border border-zinc-800 rounded px-2 py-1 outline-none"
                          >
                            <option value="user">Storefront Guest (user)</option>
                            <option value="owner">Store Admin (owner)</option>
                            <option value="mwc">Dev Operator (mwc)</option>
                          </select>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            u.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            disabled={u.id === mwc?.id}
                            className={`px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors border ${
                              u.status === 'active' 
                                ? 'border-red-500/30 hover:bg-red-500/15 text-red-400' 
                                : 'border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-400'
                            } disabled:opacity-30`}
                          >
                            {u.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2.5: Orders Manager (MWC Parity) */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList size={20} className="text-emerald-400" /> MANAGE CUSTOMER ORDERS
            </h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              {orders.length === 0 ? (
                <p className="text-xs text-zinc-500 py-10 text-center">No orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-3">Order ID</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Address & Coordinates</th>
                        <th className="py-3 text-right">Total</th>
                        <th className="py-3 text-center">Payment Verification</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-emerald-400">#{o.id}</td>
                          <td className="py-4 text-left">
                            <p className="font-semibold text-white leading-tight">{o.customer_name}</p>
                            <p className="text-[9px] text-zinc-500 break-all">{o.customer_email}</p>
                          </td>
                          <td className="py-4 max-w-xs text-zinc-400 leading-relaxed text-left" title={o.address}>
                            <p className="truncate">{o.address}</p>
                            {o.coordinates && o.coordinates.lat && o.coordinates.lng && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${o.coordinates.lat},${o.coordinates.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[8px] text-emerald-400 hover:underline font-mono uppercase tracking-widest block mt-1"
                              >
                                View Location Pin Map 🗺️
                              </a>
                            )}
                          </td>
                          <td className="py-4 text-right font-bold text-white">₹{o.total_amount.toLocaleString()}</td>
                          <td className="py-4 text-center">
                            {o.payment_status === 'pending_confirmation' ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                                  UTR: {o.transaction_ref}
                                </span>
                                <div className="flex gap-1 text-[8px] uppercase tracking-wider font-bold">
                                  <button
                                    onClick={() => handleConfirmOrderPayment(o.id)}
                                    className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded transition-colors cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectOrderPayment(o.id)}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                o.payment_status === 'paid' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : o.payment_status === 'rejected'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                              }`}>
                                {o.payment_status === 'paid' ? 'Paid (Verified)' : o.payment_status === 'rejected' ? 'Rejected' : o.payment_status}
                              </span>
                            )}
                            {o.rejection_reason && (
                              <p className="text-[8px] text-red-400 mt-1 italic leading-tight font-sans">Reason: {o.rejection_reason}</p>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <select
                              value={o.status}
                              onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="bg-zinc-950 text-zinc-300 text-[11px] font-semibold border border-zinc-800 rounded px-2.5 py-1.5 focus:border-emerald-500 outline-none cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="packed">Packed</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Site Banner announcement CMS */}
        {activeTab === 'cms' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Star size={20} className="text-emerald-400" /> STORE CMS CONTROLS
            </h2>

            <form onSubmit={handleSaveCms} className="space-y-6 text-left max-w-xl">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Global Site Banner Announcement</label>
                <textarea
                  value={bannerInput}
                  onChange={e => setBannerInput(e.target.value)}
                  rows={3}
                  placeholder="Welcome offer warnings, seasonal announcements..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-4 py-3 text-xs text-white outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Homepage featured spotlight</label>
                <select
                  value={spotlightId}
                  onChange={e => setSpotlightId(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-300 text-xs border border-zinc-800 rounded-lg px-4 py-3 focus:border-emerald-500 outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <Check size={14} strokeWidth={3} /> Save Storefront CMS Configs
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Audit Trace reports */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList size={20} className="text-emerald-400" /> SECURITY AUDIT TRACE LOGS
            </h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-10 text-center">No system actions logged yet.</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] gap-2">
                      <div className="text-left space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                            {log.action}
                          </span>
                          <span className="text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-mono">
                          Operator: {log.operator_name || 'System Guest'} ({log.operator_email || 'guest-ip'}) • Details: {log.details}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0 font-mono font-semibold">IP: {log.ip_address}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Chocolate Catalog Manager */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-emerald-400" /> CHOCOLATE PRODUCTS INVENTORY
            </h2>
            <AdminProducts token={mwcToken || ''} role="mwc" />
          </div>
        )}

        {/* TAB 6: Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star size={20} className="text-emerald-400" /> CUSTOMER REVIEWS MODERATION QUEUE
            </h2>
            <AdminReviews token={mwcToken || ''} role="mwc" />
          </div>
        )}

        {/* TAB 7: Flyer Gallery Posters */}
        {activeTab === 'posters' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-emerald-400" /> FLYER GALLERY CAMPAIGNS
            </h2>
            <AdminPosters token={mwcToken || ''} role="mwc" />
          </div>
        )}

        {/* TAB 8: Brand Heritage Page */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-400" /> BRAND ABOUT HERITAGE COPY
            </h2>
            <AdminAbout token={mwcToken || ''} role="mwc" />
          </div>
        )}

        {/* TAB 9: Translations Editor */}
        {activeTab === 'translations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Languages size={20} className="text-emerald-400" /> DYNAMIC TRANSLATION BUNDLES
            </h2>
            <AdminTranslations token={mwcToken || ''} />
          </div>
        )}

        {/* TAB 10: MWC Developer Activity Logs */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal size={20} className="text-emerald-400" /> DEVELOPER ACTION LOGGER
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 text-left">
                {mwcLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-10 text-center">No developer actions logged yet.</p>
                ) : (
                  mwcLogs.map(log => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] gap-2">
                      <div className="text-left space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-500 text-zinc-950 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider text-[8px]">
                            {log.action}
                          </span>
                          <span className="text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-mono">
                          Developer: {log.operator_name} ({log.operator_email}) • Details: {log.details}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0 font-mono font-semibold">IP: {log.ip_address}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Brand Settings (MWC Parity) */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300 text-left">
            
            {/* Left Card: Brand details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm text-emerald-400 uppercase tracking-wider font-semibold border-b border-zinc-800 pb-2">
                Brand & Concierge Settings
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Concierge Phone</label>
                  <input 
                    type="text" 
                    value={sPhone}
                    onChange={e => setSPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Concierge Email</label>
                  <input 
                    type="email" 
                    value={sEmail}
                    onChange={e => setSEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Business Address</label>
                  <input 
                    type="text" 
                    value={sAddress}
                    onChange={e => setSAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Instagram Username / Handle</label>
                  <input 
                    type="text" 
                    value={sInstagram}
                    onChange={e => setSInstagram(e.target.value)}
                    placeholder="e.g. maniskotefactory"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">QR Payment Instructions</label>
                  <textarea 
                    value={sInstructions}
                    onChange={e => setSInstructions(e.target.value)}
                    rows={3}
                    placeholder="Scan and complete UPI transfer..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </form>
            </div>

            {/* Right Card: Image uploaders */}
            <div className="space-y-6">
              {/* Logo Uploader */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm text-emerald-400 uppercase tracking-wider font-semibold border-b border-zinc-800 pb-2 mb-4">
                  Upload Custom Brand Logo
                </h3>
                <form onSubmit={handleUploadLogo} className="space-y-4">
                  {sLogoUrl && (
                    <div className="flex items-center gap-4 mb-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Logo:</span>
                      <img src={getAssetUrl(sLogoUrl)} alt="Brand Logo" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Select Image File (.png / .jpg / .svg)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSLogoFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-zinc-500 file:bg-white/5 file:border-zinc-800 file:text-zinc-300 file:text-xs file:py-1.5 file:px-3 file:rounded-lg"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!sLogoFile}
                    className={`w-full py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition-colors ${
                      sLogoFile ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-600' : 'bg-white/5 text-zinc-650 cursor-not-allowed'
                    }`}
                  >
                    Upload Logo
                  </button>
                </form>
              </div>

              {/* Payment QR Code Uploader */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm text-emerald-400 uppercase tracking-wider font-semibold border-b border-zinc-800 pb-2 mb-4">
                  Upload Payment UPI QR Code
                </h3>
                <form onSubmit={handleUploadQr} className="space-y-4">
                  {sQrUrl && (
                    <div className="flex items-center gap-4 mb-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Active QR Code:</span>
                      <img 
                        src={getAssetUrl(sQrUrl)} 
                        alt="UPI QR Code" 
                        className="w-20 h-20 object-contain bg-white p-1 rounded border border-zinc-800" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/qr-placeholder.png';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Select QR Code Image (.png / .jpg / .svg)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSQrFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-zinc-500 file:bg-white/5 file:border-zinc-800 file:text-zinc-300 file:text-xs file:py-1.5 file:px-3 file:rounded-lg"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!sQrFile}
                    className={`w-full py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition-colors ${
                      sQrFile ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-600' : 'bg-white/5 text-zinc-650 cursor-not-allowed'
                    }`}
                  >
                    Upload QR Code
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Promo Codes tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-widest">PROMOTION CODE MANAGER</h2>
            <AdminCoupons token={mwcToken || ''} role="mwc" />
          </div>
        )}

        {/* Locations tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-widest">STORE MAP LOCATIONS</h2>
            <AdminLocations token={mwcToken || ''} role="mwc" />
          </div>
        )}

      </main>

    </div>
  );
};

export default MwcDashboard;

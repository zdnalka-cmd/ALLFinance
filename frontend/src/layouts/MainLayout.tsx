import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext, currencies } from '../context/CurrencyContext';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 

  Users, 
  BookOpen,
  Bell,
  LogOut,
  MoreVertical,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  ChevronDown,
  MessageSquare,
  X
} from 'lucide-react';

interface AppNotification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" fill="none" viewBox="0 0 48 46">
    <path fill="url(#navLogoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
    <defs>
      <linearGradient id="navLogoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc"/>
        <stop offset="100%" stopColor="#7e14ff"/>
      </linearGradient>
    </defs>
  </svg>
);

const MainLayout = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { currentCurrency, setCurrentCurrency, t } = useContext(CurrencyContext);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject || !reportMessage) {
      toast.error('Harap isi subjek dan pesan laporan');
      return;
    }
    
    setIsSubmittingReport(true);
    try {
      const res = await axiosInstance.post('/reports', {
        subject: reportSubject,
        message: reportMessage
      });
      toast.success(res.data?.message || 'Laporan berhasil dikirim ke Admin');
      setIsReportModalOpen(false);
      setReportSubject('');
      setReportMessage('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      if (error.response && error.response.status === 403) {
        toast.error(error.response.data.message, { duration: 6000 });
        if (error.response.data.message.includes('terhapus')) {
          // Force logout if account deleted
          setTimeout(() => window.location.href = '/login', 3000);
        }
      } else {
        toast.error('Gagal mengirim laporan');
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleClearNotifications = async () => {
    if (!window.confirm('Bersihkan semua notifikasi?')) return;
    try {
      await axiosInstance.delete('/notifications');
      setNotifications([]);
      toast.success('Notifikasi dibersihkan');
    } catch (error) {
      console.error('Failed to clear notifications', error);
      toast.error('Gagal membersihkan notifikasi');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Berhasil keluar');
  };
  
  const handleComingSoon = (feature: string) => {
    toast(`Fitur "${feature}" akan segera hadir!`, { icon: '🚧' });
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const toastId = toast.loading('Mengunggah foto...');
      try {
        const response = await axiosInstance.post('/auth/profile/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update user context
        if (user) {
          updateUser({ ...user, profile_picture: response.data.url });
        }
        toast.success('Foto profil berhasil diperbarui', { id: toastId });
      } catch (error) {
        console.error('Error uploading profile:', error);
        toast.error('Gagal mengunggah foto profil', { id: toastId });
      }
    }
  };

  const navItems = [
    { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={15} /> },
    { name: t('income'), path: '/incomes', icon: <TrendingUp size={15} /> },
    { name: t('expense'), path: '/expenses', icon: <TrendingDown size={15} /> },
    { name: t('daily_journal'), path: '/journals', icon: <BookOpen size={15} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#0a0a0f', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top Header ── */}
      <header style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(134,59,255,0.15)' }}
        className="flex items-center justify-between px-5 py-2.5">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-black text-base tracking-tight text-white">
            ALL<span style={{ color: '#a855f7' }}>Finance</span>
          </span>
        </div>

        {/* User info + actions */}
        <div className="flex items-center gap-5">
          {/* View mode icons */}
          <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
            <button onClick={() => setViewMode('Desktop')} className={`transition-colors p-1 rounded ${viewMode === 'Desktop' ? 'text-purple-400 bg-white/10' : 'hover:text-purple-400'}`}>
              <Monitor size={14} />
            </button>
            <button onClick={() => setViewMode('Mobile')} className={`transition-colors p-1 rounded ${viewMode === 'Mobile' ? 'text-purple-400 bg-white/10' : 'hover:text-purple-400'}`}>
              <Smartphone size={14} />
            </button>
            <button onClick={() => setViewMode('Tablet')} className={`transition-colors p-1 rounded ${viewMode === 'Tablet' ? 'text-purple-400 bg-white/10' : 'hover:text-purple-400'}`}>
              <Tablet size={14} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Notification */}
          <div className="relative">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative hover:text-purple-400 transition-colors" style={{ color: '#6b7280' }}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(134,59,255,0.1)' }}>
                  <h3 className="text-sm font-bold text-white">Notifikasi</h3>
                  {notifications.length > 0 && (
                    <button onClick={handleClearNotifications} className="text-xs text-purple-400 hover:text-purple-300">
                      Bersihkan Semua
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto hide-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs" style={{ color: '#6b7280' }}>Belum ada notifikasi</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} 
                        onClick={() => { if(!notif.is_read) markAsRead(notif.id) }}
                        className={`px-4 py-3 text-xs cursor-pointer transition-colors border-b last:border-b-0`}
                        style={{ 
                          borderColor: 'rgba(255,255,255,0.05)',
                          background: notif.is_read ? 'transparent' : 'rgba(134,59,255,0.05)',
                        }}>
                        <div className="flex gap-3">
                          <div className="mt-0.5" style={{ color: notif.is_read ? '#4b5563' : '#a855f7' }}>
                            <Bell size={14} />
                          </div>
                          <div>
                            <p style={{ color: notif.is_read ? '#9ca3af' : '#e9d5ff', fontWeight: notif.is_read ? 500 : 700 }}>
                              {notif.message}
                            </p>
                            <span className="text-[10px] mt-1 block" style={{ color: '#6b7280' }}>
                              {new Date(notif.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Laporan</span>
          </button>

          {/* Currency Selector */}
          <div className="relative">
            <button onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} className="flex items-center gap-1.5 hover:text-purple-400 transition-colors bg-white/5 px-2 py-1.5 rounded-lg border border-white/10" style={{ color: '#e9d5ff' }}>
              <span className="text-sm">{currentCurrency.flag}</span>
              <span className="text-xs font-bold hidden sm:inline">{currentCurrency.code}</span>
              <ChevronDown size={12} className={`transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCurrencyOpen && (
              <div className="absolute right-0 mt-3 w-40 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
                {currencies.map((c) => (
                  <div key={c.code} 
                    onClick={() => { setCurrentCurrency(c); setIsCurrencyOpen(false); }}
                    className={`px-4 py-2 text-xs cursor-pointer transition-colors flex items-center gap-2 hover:bg-white/10 ${currentCurrency.code === c.code ? 'bg-purple-900/30' : ''}`}
                  >
                    <span className="text-sm">{c.flag}</span>
                    <span className="font-bold text-gray-200">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2.5 cursor-pointer group" title="Ubah Profil Saya" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/png, image/jpeg, image/jpg" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white bg-cover bg-center overflow-hidden"
              style={{ 
                backgroundImage: user?.profile_picture ? `url(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile_picture})` : 'linear-gradient(135deg, #6d28d9, #863bff)', 
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                boxShadow: '0 0 12px rgba(134,59,255,0.4)' 
              }}>
              {!user?.profile_picture && (user?.name?.charAt(0)?.toUpperCase() || 'K')}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user?.name || 'Kasir'}</p>
              <p className="text-[10px] font-medium leading-none mt-0.5" style={{ color: '#a855f7' }}>di AllFinance</p>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:text-white"
            style={{ color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#9ca3af';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            }}>
            <LogOut size={13} />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </header>

      {/* ── Navigation Bar ── */}
      <nav className="flex items-center justify-between px-2"
        style={{ background: '#0d0d1a', borderBottom: '1px solid rgba(134,59,255,0.2)' }}>
        <div className="flex overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all relative"
                style={{
                  color: isActive ? '#c084fc' : '#6b7280',
                  background: isActive ? 'rgba(134,59,255,0.08)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#a78bfa';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(134,59,255,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#6b7280';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #c084fc)' }} />
                )}
                <span style={{ color: isActive ? '#c084fc' : '#6b7280' }}>{item.icon}</span>
                <span style={{ color: isActive ? '#e9d5ff' : '#6b7280', fontWeight: isActive ? 700 : 500 }}>
                  {item.name}
                </span>
              </Link>
            );
          })}

        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto flex justify-center" style={{ background: '#07070f', padding: '24px' }}>
        <div className={`mx-auto w-full transition-all duration-300 ease-in-out`}
          style={{ 
            maxWidth: viewMode === 'Mobile' ? '375px' : viewMode === 'Tablet' ? '768px' : '1400px',
            border: viewMode !== 'Desktop' ? '1px solid rgba(134,59,255,0.3)' : 'none',
            borderRadius: viewMode !== 'Desktop' ? '16px' : '0',
            overflow: 'hidden'
          }}>
          <Outlet />
        </div>
      </main>

      {/* ── Report Modal ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#0f0f1a] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-400" />
                Kirim Laporan
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4 text-xs p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <p className="font-bold mb-1">Peringatan Sistem Anti-Spam:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Anda memiliki batas maksimal 3 kuota laporan.</li>
                  <li>Jika kuota habis, Anda harus menunggu 2 hari.</li>
                  <li>Jika melanggar lebih dari 3 kali, akun akan dihapus otomatis!</li>
                </ul>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-400">Subjek</label>
                <input 
                  type="text" 
                  value={reportSubject}
                  onChange={e => setReportSubject(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/20 bg-black/50 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Misal: Bug, Fitur Baru, atau Bantuan"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-gray-400">Pesan Laporan</label>
                <textarea 
                  value={reportMessage}
                  onChange={e => setReportMessage(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/20 bg-black/50 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none min-h-[100px]"
                  placeholder="Jelaskan masalah atau laporan Anda secara detail..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-400 hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmittingReport} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                  {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MainLayout;

import React, { useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Bell
} from 'lucide-react';

const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" fill="none" viewBox="0 0 48 46">
    <path fill="url(#adminLogoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
    <defs>
      <linearGradient id="adminLogoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="100%" stopColor="#1e3a8a"/>
      </linearGradient>
    </defs>
  </svg>
);

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(CurrencyContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  React.useEffect(() => {
    // Check for unread notifications where type is 'report'
    const fetchNotifications = async () => {
      try {
        const { default: axiosInstance } = await import('../api/axiosInstance');
        const res = await axiosInstance.get('/notifications');
        // Admin gets 'report' notifications
        const adminNotifs = res.data.filter((n: any) => n.type === 'report');
        setNotifications(adminNotifs);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClearNotifications = async () => {
    if (!window.confirm('Bersihkan semua notifikasi?')) return;
    try {
      const { default: axiosInstance } = await import('../api/axiosInstance');
      await axiosInstance.delete('/notifications');
      setNotifications([]);
      toast.success('Notifikasi dibersihkan');
    } catch (error) {
      toast.error('Gagal membersihkan notifikasi');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Admin berhasil keluar');
  };

  const navItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: <LayoutDashboard size={15} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#0a0f1a', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top Header ── */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid rgba(59,130,246,0.15)' }}
        className="flex items-center justify-between px-5 py-2.5">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,58,138,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Logo />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">AllFinance</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-widest border border-blue-500/20">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">

          <div className="h-4 w-px bg-white/10"></div>

          {/* Notification Bell */}
          <div className="relative">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative flex h-8 w-8 items-center justify-center rounded-full text-blue-400 hover:bg-blue-500/10 transition-colors">
              <Bell size={18} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-[#0f172a]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-blue-500/20 bg-[#0f172a] shadow-xl z-50">
                <div className="border-b border-blue-500/10 px-4 py-3 flex items-center justify-between bg-blue-500/5 rounded-t-xl">
                  <h3 className="font-bold text-white text-sm">Notifikasi</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">{notifications.length} Baru</span>
                    {notifications.length > 0 && (
                      <button onClick={handleClearNotifications} className="text-[10px] text-blue-400 hover:text-blue-300">
                        Bersihkan
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">Tidak ada notifikasi</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`border-b border-white/5 px-4 py-3 ${!n.is_read ? 'bg-blue-500/5' : ''}`}>
                        <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                        <p className="mt-1 text-[10px] text-gray-500">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile */}
          <div className="flex items-center gap-3 pl-1">
            <div className="relative group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck size={16} />
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] font-medium text-blue-400">{user?.role}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.05)';
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
        style={{ background: '#0f172a', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap"
                style={{ color: isActive ? '#fff' : '#94a3b8' }}>
                <div style={{ color: isActive ? '#60a5fa' : 'inherit' }}>
                  {item.icon}
                </div>
                {item.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
        {/* Background ambient light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;

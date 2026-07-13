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
  BookOpen,
  Bell,
  LogOut,
  MoreVertical,
  ChevronDown,
  MessageSquare,
  X,
  Lock,
} from 'lucide-react';

interface AppNotification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" fill="none" viewBox="0 0 48 46">
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { currentCurrency, setCurrentCurrency, t, formatCurrency } = useContext(CurrencyContext);
  
  const renderNotifMessage = (msg: string) => {
    if (msg.startsWith('NEW_INCOME|')) {
      const [, amount, category] = msg.split('|');
      return `${t('new_income_recorded')}: ${formatCurrency(Number(amount))} (${category})`;
    }
    if (msg.startsWith('NEW_EXPENSE|')) {
      const [, amount, category] = msg.split('|');
      return `${t('new_expense_recorded')}: ${formatCurrency(Number(amount))} (${category})`;
    }
    return msg;
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject || !reportMessage) { toast.error(t('fill_report_form')); return; }
    setIsSubmittingReport(true);
    try {
      const res = await axiosInstance.post('/reports', { subject: reportSubject, message: reportMessage });
      toast.success(res.data?.message || t('report_sent_success'));
      setIsReportModalOpen(false);
      setReportSubject('');
      setReportMessage('');
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message, { duration: 6000 });
      } else {
        toast.error(t('report_sent_failed'));
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    const handleSuspension = () => { if (user && !user.is_suspended) updateUser({ ...user, is_suspended: true }); };
    window.addEventListener('user_suspended', handleSuspension);
    return () => { clearInterval(interval); window.removeEventListener('user_suspended', handleSuspension); };
  }, [user, updateUser]);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/notifications');
      setNotifications(res.data);
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleClearNotifications = async () => {
    if (!window.confirm(t('confirm_clear_notifs'))) return;
    try {
      await axiosInstance.delete('/notifications');
      setNotifications([]);
      toast.success(t('notifications_cleared'));
    } catch {
      toast.error(t('notifications_clear_failed'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success(t('logout_success'));
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('profile_picture', file);
      const toastId = toast.loading(t('uploading_photo'));
      try {
        const response = await axiosInstance.post('/auth/profile/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (user) updateUser({ ...user, profile_picture: response.data.url });
        toast.success(t('photo_uploaded_success'), { id: toastId });
      } catch {
        toast.error(t('photo_upload_failed'), { id: toastId });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={18} /> },
    { name: t('income'), path: '/incomes', icon: <TrendingUp size={18} /> },
    { name: t('expense'), path: '/expenses', icon: <TrendingDown size={18} /> },
    { name: t('daily_journal'), path: '/journals', icon: <BookOpen size={18} /> },
  ];

  const closeAll = () => { setIsNotifOpen(false); setIsCurrencyOpen(false); setIsMobileMenuOpen(false); };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#0a0a0f', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══ TOP HEADER (all screens) ══ */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-5 py-2.5"
        style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(134,59,255,0.15)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-black text-sm sm:text-base tracking-tight text-white">
            ALL<span style={{ color: '#a855f7' }}>Finance</span>
          </span>
        </div>

        {/* ─── Desktop nav tabs (hidden on mobile) ─── */}
        <nav className="hidden sm:flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
                style={{ color: isActive ? '#c084fc' : '#6b7280', background: isActive ? 'rgba(134,59,255,0.1)' : 'transparent' }}>
                {item.icon}
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ─── Right actions (desktop) ─── */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {/* Notification */}
          <div className="relative">
            <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsCurrencyOpen(false); setIsMobileMenuOpen(false); }}
              className="relative p-1.5 hover:text-purple-400 transition-colors" style={{ color: '#6b7280' }}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black text-white"
                  style={{ background: '#7c3aed' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(134,59,255,0.1)' }}>
                  <h3 className="text-sm font-bold text-white">{t('notifications')}</h3>
                  {notifications.length > 0 && (
                    <button onClick={handleClearNotifications} className="text-xs text-purple-400 hover:text-purple-300">{t('clear_all')}</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto hide-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500">{t('no_notifications')}</div>
                  ) : notifications.map(notif => (
                    <div key={notif.id} onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                      className="px-4 py-3 text-xs cursor-pointer border-b border-white/5 last:border-b-0 flex gap-3"
                      style={{ background: notif.is_read ? 'transparent' : 'rgba(134,59,255,0.05)' }}>
                      <Bell size={13} className="shrink-0 mt-0.5" style={{ color: notif.is_read ? '#4b5563' : '#a855f7' }} />
                      <div>
                        <p style={{ color: notif.is_read ? '#9ca3af' : '#e9d5ff', fontWeight: notif.is_read ? 500 : 700 }}>{renderNotifMessage(notif.message)}</p>
                        <span className="text-[10px] mt-0.5 block text-gray-600">{new Date(notif.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report button */}
          <button onClick={() => { setIsReportModalOpen(true); closeAll(); }}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 sm:px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20">
            <MessageSquare size={13} />
            <span className="hidden lg:inline">{t('send_report')}</span>
          </button>

          {/* Currency */}
          <div className="relative">
            <button onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsNotifOpen(false); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-1 bg-white/5 px-2 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-purple-400 transition-colors">
              <span className="text-sm">{currentCurrency.flag}</span>
              <span className="text-xs font-bold hidden md:inline">{currentCurrency.code}</span>
              <ChevronDown size={11} className={`transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCurrencyOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
                {currencies.map(c => (
                  <div key={c.code} onClick={() => { setCurrentCurrency(c); setIsCurrencyOpen(false); }}
                    className={`px-4 py-2 text-xs cursor-pointer flex items-center gap-2 hover:bg-white/10 ${currentCurrency.code === c.code ? 'bg-purple-900/30' : ''}`}>
                    <span>{c.flag}</span><span className="font-bold text-gray-200">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/png,image/jpeg,image/jpg" />
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-black text-white overflow-hidden"
              style={{
                backgroundImage: user?.profile_picture ? `url(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile_picture})` : 'linear-gradient(135deg, #6d28d9, #863bff)',
                backgroundSize: 'cover', backgroundPosition: 'center',
                boxShadow: '0 0 10px rgba(134,59,255,0.4)'
              }}>
              {!user?.profile_picture && (user?.name?.charAt(0)?.toUpperCase() || 'K')}
            </div>
            <span className="hidden lg:block text-xs font-bold text-white">{user?.name}</span>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-bold text-gray-400 border border-white/8 bg-white/3 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all">
            <LogOut size={13} />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>

        {/* ─── Mobile right: bell + avatar + more ─── */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsMobileMenuOpen(false); }}
            className="relative p-2" style={{ color: '#9ca3af' }}>
            <Bell size={19} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-purple-500 ring-1 ring-black" />}
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundImage: user?.profile_picture ? `url(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile_picture})` : 'linear-gradient(135deg, #6d28d9, #863bff)',
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}>
            <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/png,image/jpeg,image/jpg" />
            {!user?.profile_picture && (user?.name?.charAt(0)?.toUpperCase() || 'K')}
          </div>
          <button onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsNotifOpen(false); }}
            className="p-2" style={{ color: '#9ca3af' }}>
            <MoreVertical size={19} />
          </button>
        </div>
      </header>

      {/* ─── Mobile notification panel ─── */}
      {isNotifOpen && (
        <div className="sm:hidden fixed top-[52px] inset-x-3 z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(134,59,255,0.1)' }}>
            <span className="text-sm font-bold text-white">{t('notifications')}</span>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && <button onClick={handleClearNotifications} className="text-xs text-purple-400">{t('clear_all')}</button>}
              <button onClick={() => setIsNotifOpen(false)}><X size={15} className="text-gray-400" /></button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-5 text-center text-xs text-gray-500">{t('no_notifications')}</div>
            ) : notifications.map(notif => (
              <div key={notif.id} onClick={() => { if (!notif.is_read) markAsRead(notif.id); setIsNotifOpen(false); }}
                className="px-4 py-3 text-xs cursor-pointer border-b border-white/5 last:border-b-0"
                style={{ background: notif.is_read ? 'transparent' : 'rgba(134,59,255,0.05)' }}>
                <p style={{ color: notif.is_read ? '#9ca3af' : '#e9d5ff', fontWeight: notif.is_read ? 500 : 700 }}>{renderNotifMessage(notif.message)}</p>
                <span className="text-[10px] mt-0.5 block text-gray-600">{new Date(notif.created_at).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Mobile extra menu (currency, report, logout) ─── */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed top-[52px] right-3 z-50 w-52 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#12121c', border: '1px solid rgba(134,59,255,0.2)' }}>
          <div className="p-3 flex flex-col gap-1">
            <p className="px-2 text-[10px] font-bold uppercase text-gray-500 mb-1">{t('currency') || 'Mata Uang'}</p>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {currencies.map(c => (
                <button key={c.code} onClick={() => { setCurrentCurrency(c); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentCurrency.code === c.code ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                  <span>{c.flag}</span><span>{c.code}</span>
                </button>
              ))}
            </div>
            <div className="h-px bg-white/5" />
            <button onClick={() => { setIsReportModalOpen(true); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-purple-400 hover:bg-white/5 rounded-lg w-full text-left">
              <MessageSquare size={14} /> {t('send_report')}
            </button>
            <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg w-full text-left">
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 overflow-auto" style={{ background: '#07070f', padding: '16px', paddingBottom: '80px' }}>
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4"
        style={{ background: 'rgba(13,13,26,0.97)', borderTop: '1px solid rgba(134,59,255,0.2)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all"
              style={{ color: isActive ? '#c084fc' : '#4b5563' }}>
              <span className={`p-1 rounded-lg transition-all ${isActive ? 'bg-purple-500/20' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[9px] font-bold tracking-wide leading-none"
                style={{ color: isActive ? '#c084fc' : '#4b5563' }}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ══ REPORT MODAL ══ */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-purple-500/20 bg-[#0f0f1a] p-5 sm:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-400" />
                {t('send_report')}
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">{t('report_subject')}</label>
                <input type="text" value={reportSubject} onChange={e => setReportSubject(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/20 bg-black/50 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder={t('report_subject_placeholder')} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">{t('report_message')}</label>
                <textarea value={reportMessage} onChange={e => setReportMessage(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/20 bg-black/50 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none min-h-[90px]"
                  placeholder={t('report_message_placeholder')} required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-gray-400 hover:bg-white/10">{t('cancel')}</button>
                <button type="submit" disabled={isSubmittingReport}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50">
                  {isSubmittingReport ? t('sending') : t('send_report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ SUSPENDED OVERLAY ══ */}
      {user?.is_suspended && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-[#0f0f1a] p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-rose-500/20 blur-[60px] rounded-full" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-rose-500/10 blur-[60px] rounded-full" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
                <Lock size={28} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">{t('account_suspended_title')}</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">{t('account_suspended_desc')}</p>
              <div className="flex flex-col gap-2 w-full">
                <button onClick={handleLogout}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-300 hover:bg-white/10 transition-all">
                  {t('logout')}
                </button>
                <button onClick={() => setIsReportModalOpen(true)}
                  className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-500 transition-all">
                  {t('report_to_admin')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;

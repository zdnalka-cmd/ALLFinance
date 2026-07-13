import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import { Users, Activity, ShieldAlert, MessageSquare, TrendingUp, TrendingDown, Trash2, Lock, Unlock, BarChart3, LineChart as LineChartIcon, Search, ChevronLeft, ChevronRight, Image, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const EXPENSE_CAT_COLORS: Record<string, string> = {
  food: '#c2410c',         // Orange 700
  beauty: '#be185d',       // Pink 700
  culture: '#7e22ce',      // Purple 700
  health: '#047857',       // Emerald 700
  gift: '#b45309',         // Amber 700
  transportation: '#1d4ed8',// Blue 700
  education: '#0e7490',    // Cyan 700
  household: '#4d7c0f',    // Lime 700
  apparel: '#be123c',      // Rose 700
};
const FALLBACK_COLORS = ['#c2410c', '#be185d', '#7e22ce', '#047857', '#b45309', '#1d4ed8', '#0e7490', '#4d7c0f', '#be123c'];

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { formatCurrency, t } = useContext(CurrencyContext);
  const [stats, setStats] = useState({ totalUsers: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Pagination & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Receipt Modal State
  const [selectedUserReceipts, setSelectedUserReceipts] = useState<{ id: string, name: string } | null>(null);
  const [userReceipts, setUserReceipts] = useState<any[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, reportsRes, trendsRes, catRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/reports'),
        axiosInstance.get('/admin/trends'),
        axiosInstance.get('/admin/categories/popular')
      ]);

      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setReports(reportsRes.data);
      setTrends(trendsRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error(t('admin_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(() => {
      // Background silent refresh for online status
      axiosInstance.get('/admin/users').then(res => setUsersList(res.data)).catch(() => { });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/suspend`);
      toast.success(isSuspended ? t('account_activated') : t('account_suspended'));
      fetchAdminData();
    } catch (error) {
      toast.error(t('status_update_failed'));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm(t('delete_account_confirm'))) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success(t('account_deleted'));
      fetchAdminData();
    } catch (error) {
      toast.error(t('account_delete_failed'));
    }
  };

  const handleDeleteProfilePicture = async (userId: string) => {
    if (!window.confirm(t('confirm_delete_profile_picture'))) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}/profile-picture`);
      toast.success(t('profile_picture_deleted'));
      fetchAdminData();
    } catch (error) {
      toast.error(t('profile_picture_delete_failed'));
    }
  };

  const handleDeleteReceiptPhoto = async (receiptId: string) => {
    if (!window.confirm(t('confirm_delete_receipt_photo'))) return;
    try {
      await axiosInstance.delete(`/admin/receipts/${receiptId}/photo`);
      toast.success(t('receipt_photo_deleted'));
      // refresh receipts
      if (selectedUserReceipts) {
        handleViewReceipts(selectedUserReceipts.id, selectedUserReceipts.name);
      }
    } catch (error) {
      toast.error(t('receipt_photo_delete_failed'));
    }
  };

  const isOnline = (lastActive: string) => {
    if (!lastActive) return false;
    const diff = new Date().getTime() - new Date(lastActive).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const handleViewReceipts = async (userId: string, userName: string) => {
    setSelectedUserReceipts({ id: userId, name: userName });
    setIsReceiptModalOpen(true);
    setLoadingReceipts(true);
    setUserReceipts([]);
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}/receipts`);
      setUserReceipts(res.data);
    } catch (error) {
      toast.error(t('receipt_load_failed'));
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleReplySubmit = async (reportId: string) => {
    if (!replyText.trim()) return toast.error(t('reply_empty'));
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/reply`, { replyText });
      toast.success(t('reply_sent'));
      setReplyingTo(null);
      setReplyText('');
      fetchAdminData();
    } catch (error) {
      toast.error(t('reply_failed'));
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm(t('delete_report_confirm'))) return;
    try {
      await axiosInstance.delete(`/admin/reports/${reportId}`);
      toast.success(t('report_deleted'));
      fetchAdminData();
    } catch (error) {
      toast.error(t('report_delete_failed'));
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const color = EXPENSE_CAT_COLORS[data.payload.name.toLowerCase()] || FALLBACK_COLORS[categories.findIndex(c => c.name === data.payload.name) % FALLBACK_COLORS.length] || '#8b5cf6';
      
      return (
        <div className="rounded-xl border border-white/10 bg-black/80 p-3 shadow-xl shadow-purple-900/20 backdrop-blur-md">
          <p className="text-sm font-bold text-gray-200 capitalize mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
            {label}
          </p>
          <p className="text-xs font-medium" style={{ color: color }}>
            {data.value} <span className="text-gray-400">transaksi</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl font-sans pb-10 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-blue-500/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-400 font-bold">Selamat datang kembali, {user?.name}</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-blue-400 font-bold">Memuat data...</div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-blue-500/20 bg-[#0f172a] p-4 sm:p-5 shadow-sm transition-all hover:border-blue-500/50">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users size={16} />
                </div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Total Pengguna</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalUsers}</p>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-[#0f172a] p-4 sm:p-5 shadow-sm transition-all hover:border-indigo-500/50">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Activity size={16} />
                </div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Status Sistem</h3>
              </div>
              <p className="text-base sm:text-xl font-black text-emerald-400">Online & Stabil</p>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-[#0f172a] p-4 sm:p-5 shadow-sm transition-all hover:border-rose-500/50 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Total Laporan</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{reports.length}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-blue-500/20 bg-[#0f172a] p-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <LineChartIcon size={18} className="text-blue-400" />
                Tren Transaksi Global
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} width={80} tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-[#0f172a] p-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <BarChart3 size={18} className="text-purple-400" />
                Kategori Terpopuler
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      {categories.map((entry, index) => {
                        const key = entry.name.toLowerCase();
                        const color = EXPENSE_CAT_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                        return (
                          <linearGradient key={`gradient-${index}`} id={`colorUv-${index}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} stopOpacity={1} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={true} opacity={0.4} />
                    <XAxis type="number" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} axisLine={false} tickLine={false} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} style={{ textTransform: 'capitalize' }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorUv-${index})`} style={{ filter: `drop-shadow(0px 0px 4px ${EXPENSE_CAT_COLORS[entry.name.toLowerCase()] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}40)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">

            {/* Users List */}
            <div className="rounded-xl border border-blue-500/20 bg-[#0f172a] overflow-hidden">
              <div className="p-4 border-b border-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-500/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  Manajemen Pengguna
                </h2>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full sm:w-64 rounded-lg border border-blue-500/20 bg-black/40 py-1.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400 responsive-table">
                  <thead className="bg-[#0a0f1a] text-xs uppercase text-gray-500 border-b border-blue-500/10">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-bold">Pengguna</th>
                      <th className="px-3 sm:px-4 py-3 font-bold hidden sm:table-cell">Status</th>
                      <th className="px-3 sm:px-4 py-3 font-bold hidden md:table-cell">Total Pemasukan</th>
                      <th className="px-3 sm:px-4 py-3 font-bold hidden md:table-cell">Total Pengeluaran</th>
                      <th className="px-3 sm:px-4 py-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                          {searchQuery ? 'Tidak ada pengguna yang cocok dengan pencarian' : 'Belum ada pengguna terdaftar'}
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr key={u.id} className="border-b border-blue-500/5 hover:bg-blue-500/5 transition-colors">
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white bg-cover bg-center overflow-hidden"
                                style={{
                                  backgroundImage: u.profile_picture ? `url(${u.profile_picture.startsWith('data:') ? u.profile_picture : (import.meta.env.VITE_API_URL || 'http://localhost:5000') + u.profile_picture})` : 'linear-gradient(135deg, #6d28d9, #863bff)',
                                  backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat',
                                }}>
                                {!u.profile_picture && (u.name?.charAt(0)?.toUpperCase() || 'U')}
                              </div>
                              <div>
                                <p className="font-bold text-gray-200 text-xs sm:text-sm">{u.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                            <div className="flex flex-col gap-1">
                              {u.is_suspended ? (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-500">
                                  <Lock size={12} /> Ditangguhkan
                                </span>
                              ) : isOnline(u.last_active) ? (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online
                                </span>
                              ) : (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-bold text-gray-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span> Offline
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-medium text-emerald-400 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <TrendingUp size={14} />
                              {new Intl.NumberFormat(u.currency === 'USD' ? 'en-US' : u.currency === 'JPY' ? 'ja-JP' : u.currency === 'SGD' ? 'en-SG' : u.currency === 'EUR' ? 'en-IE' : u.currency === 'GBP' ? 'en-GB' : u.currency === 'MYR' ? 'ms-MY' : 'id-ID', { style: 'currency', currency: u.currency || 'IDR', maximumFractionDigits: (u.currency === 'IDR' || u.currency === 'JPY') ? 0 : 2 }).format(u.totalIncome)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-medium text-rose-400 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <TrendingDown size={14} />
                              {new Intl.NumberFormat(u.currency === 'USD' ? 'en-US' : u.currency === 'JPY' ? 'ja-JP' : u.currency === 'SGD' ? 'en-SG' : u.currency === 'EUR' ? 'en-IE' : u.currency === 'GBP' ? 'en-GB' : u.currency === 'MYR' ? 'ms-MY' : 'id-ID', { style: 'currency', currency: u.currency || 'IDR', maximumFractionDigits: (u.currency === 'IDR' || u.currency === 'JPY') ? 0 : 2 }).format(u.totalExpense)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              {u.profile_picture && (
                                <button
                                  onClick={() => handleDeleteProfilePicture(u.id)}
                                  className="rounded p-1.5 transition-colors bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                                  title={t('delete_profile_picture')}
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleViewReceipts(u.id, u.name)}
                                className="rounded p-1.5 transition-colors bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                title="Lihat Kwitansi"
                              >
                                <Image size={16} />
                              </button>
                              <button
                                onClick={() => handleSuspend(u.id, u.is_suspended)}
                                className={`rounded p-1.5 transition-colors ${u.is_suspended ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}
                                title={u.is_suspended ? "Buka Tangguh" : "Tangguhkan Akun"}
                              >
                                {u.is_suspended ? <Unlock size={16} /> : <Lock size={16} />}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="rounded p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                                title="Hapus Permanen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-blue-500/10 flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    Menampilkan <span className="font-bold text-gray-300">{((currentPage - 1) * itemsPerPage) + 1}</span> hingga <span className="font-bold text-gray-300">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-bold text-gray-300">{filteredUsers.length}</span> pengguna
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:hover:bg-blue-500/10 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:hover:bg-blue-500/10 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reports List */}
            <div className="rounded-xl border border-purple-500/20 bg-[#0f172a] overflow-hidden">
              <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-purple-500/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-purple-400" />
                  Laporan Masuk & Tiket
                </h2>
              </div>
              <div className="p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {reports.length === 0 ? (
                  <div className="text-center text-gray-500 italic py-8">Belum ada laporan dari pengguna.</div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="rounded-lg border border-white/5 bg-black/20 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">{report.subject}</h4>
                          <p className="text-xs text-gray-500">Dari: {report.user.name} ({report.user.email})</p>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${report.status === 'Dijawab' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed">{report.message}</p>
                      <p className="text-[10px] text-gray-600 mt-2">
                        {new Date(report.created_at).toLocaleString('id-ID')}
                      </p>

                      {report.admin_reply && (
                        <div className="mt-3 rounded bg-purple-500/10 p-3 border border-purple-500/20 relative">
                          <p className="text-xs font-bold text-purple-400 mb-1">Balasan Anda:</p>
                          <p className="text-sm text-gray-300">{report.admin_reply}</p>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 p-1"
                            title="Hapus Laporan Selesai"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      {!report.admin_reply && (
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col items-end gap-2">
                          {replyingTo === report.id ? (
                            <div className="w-full flex flex-col gap-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Tulis balasan..."
                                className="w-full rounded bg-black/40 border border-purple-500/20 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                rows={3}
                              ></textarea>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setReplyingTo(null)} className="text-xs text-gray-400 hover:text-white">Batal</button>
                                <button onClick={() => handleReplySubmit(report.id)} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded font-bold">Kirim Balasan</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(report.id)}
                              className="text-xs font-bold text-purple-400 hover:text-purple-300"
                            >
                              Balas Laporan ini
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && selectedUserReceipts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-blue-500/20 bg-[#0f172a] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-blue-500/10 flex items-center justify-between bg-blue-500/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Image size={18} className="text-blue-400" />
                Kwitansi: {selectedUserReceipts.name}
              </h2>
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setSelectedUserReceipts(null);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {loadingReceipts ? (
                <div className="flex h-40 items-center justify-center text-gray-400 font-medium">
                  Memuat kwitansi...
                </div>
              ) : userReceipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic">
                  <Image size={32} className="opacity-20 mb-2" />
                  <p>Tidak ada kwitansi yang diunggah oleh pengguna ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userReceipts.map(receipt => (
                    <div key={receipt.id} className="rounded-xl border border-white/5 bg-black/30 overflow-hidden flex flex-col group">
                      <div
                        className="h-48 w-full bg-cover bg-center cursor-pointer relative overflow-hidden"
                        style={{ backgroundImage: `url(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${receipt.receipt})` }}
                        onClick={() => setZoomedImage(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${receipt.receipt}`)}
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <span className="text-white font-bold bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm">
                            Perbesar Foto
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteReceiptPhoto(receipt.id); }}
                            className="bg-rose-600/90 text-white font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm flex items-center gap-1 hover:bg-rose-500 transition-colors shadow-lg"
                            title={t('delete_receipt_photo')}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-rose-400 font-black text-lg">{formatCurrency(receipt.amount)}</span>
                          <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            {receipt.category?.name || 'Kategori'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mt-1">{receipt.note || 'Tanpa catatan'}</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">
                          {new Date(receipt.transaction_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed Receipt"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10"
          />
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
            onClick={() => setZoomedImage(null)}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

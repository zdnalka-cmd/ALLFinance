import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import { Users, Activity, ShieldAlert, MessageSquare, TrendingUp, TrendingDown, Trash2, Lock, Unlock, BarChart3, LineChart as LineChartIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { formatCurrency } = useContext(CurrencyContext);
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
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(() => {
      // Background silent refresh for online status
      axiosInstance.get('/admin/users').then(res => setUsersList(res.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/suspend`);
      toast.success(`Akun berhasil di${isSuspended ? 'aktifkan' : 'tangguhkan'}`);
      fetchAdminData();
    } catch (error) {
      toast.error('Gagal mengubah status akun');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Yakin ingin menghapus akun ini secara permanen beserta semua transaksinya?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success('Akun berhasil dihapus');
      fetchAdminData();
    } catch (error) {
      toast.error('Gagal menghapus akun');
    }
  };

  const isOnline = (lastActive: string) => {
    if (!lastActive) return false;
    const diff = new Date().getTime() - new Date(lastActive).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const handleReplySubmit = async (reportId: string) => {
    if (!replyText.trim()) return toast.error('Teks balasan kosong');
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/reply`, { replyText });
      toast.success('Balasan terkirim');
      setReplyingTo(null);
      setReplyText('');
      fetchAdminData();
    } catch (error) {
      toast.error('Gagal mengirim balasan');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await axiosInstance.delete(`/admin/reports/${reportId}`);
      toast.success('Laporan berhasil dihapus');
      fetchAdminData();
    } catch (error) {
      toast.error('Gagal menghapus laporan');
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

  return (
    <div className="mx-auto max-w-7xl font-sans pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-blue-500/10 pb-5">
        <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 font-bold">Selamat datang kembali, {user?.name}</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-blue-400 font-bold">Memuat data...</div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-blue-500/20 bg-[#0f172a] p-5 shadow-sm transition-all hover:border-blue-500/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Pengguna</h3>
              </div>
              <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-[#0f172a] p-5 shadow-sm transition-all hover:border-indigo-500/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Activity size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Status Sistem</h3>
              </div>
              <p className="text-xl font-black text-emerald-400 mt-2">Online & Stabil</p>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-[#0f172a] p-5 shadow-sm transition-all hover:border-rose-500/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Laporan</h3>
              </div>
              <p className="text-3xl font-black text-white">{reports.length}</p>
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
                    <YAxis stroke="#64748b" fontSize={12} width={80} tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}M`} />
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
                  <BarChart data={categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value: any) => [`${value} kali digunakan`, 'Total Penggunaan']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categories.map((entry, index) => {
                        const key = entry.name.toLowerCase();
                        const color = EXPENSE_CAT_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
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
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#0a0f1a] text-xs uppercase text-gray-500 border-b border-blue-500/10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Pengguna</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Total Pemasukan</th>
                      <th className="px-4 py-3 font-bold">Total Pengeluaran</th>
                      <th className="px-4 py-3 font-bold text-right">Aksi</th>
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
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-200">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 font-medium text-emerald-400">
                            <div className="flex items-center gap-1">
                              <TrendingUp size={14} />
                              {formatCurrency(u.totalIncome)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-rose-400">
                            <div className="flex items-center gap-1">
                              <TrendingDown size={14} />
                              {formatCurrency(u.totalExpense)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
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
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          report.status === 'Dijawab' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
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

    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Search, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { CurrencyContext } from '../context/CurrencyContext';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    note: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetDuration, setBudgetDuration] = useState('30');
  const [budgetCustomDuration, setBudgetCustomDuration] = useState('');

  const fetchData = async () => {
    try {
      const [expensesRes, catRes] = await Promise.all([
        axiosInstance.get('/finance/expenses'),
        axiosInstance.get('/finance/categories')
      ]);
      setExpenses(expensesRes.data);
      setCategories(catRes.data.filter((c: any) => c.type === 'expense'));
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error('Gagal memuat data: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (action: string) => {
    toast(`${action} akan segera hadir!`, { icon: '🚧' });
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      let duration = budgetDuration;
      if (duration === 'custom') {
        duration = budgetCustomDuration;
      }
      await axiosInstance.put(`/finance/categories/${selectedCategory.id}/budget`, {
        budget_limit: budgetAmount,
        budget_name: budgetName,
        duration_days: duration
      });
      toast.success('Anggaran berhasil disimpan');
      setBudgetModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Budget error:', error.response?.data || error);
      toast.error('Gagal menyimpan: ' + (error.response?.data?.message || error.response?.data?.error || error.message));
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('category_id', formData.category_id);
      data.append('note', formData.note);
      data.append('transaction_date', formData.transaction_date);
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      await axiosInstance.post('/finance/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Pengeluaran berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({
        amount: '',
        category_id: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setReceiptFile(null);
      fetchData(); // refresh data
    } catch (error) {
      toast.error('Gagal menambahkan pengeluaran');
    }
  };

  const handleDeleteExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseToDelete || !deletePassword) return;

    try {
      await axiosInstance.delete(`/finance/expenses/${expenseToDelete}`, {
        data: { password: deletePassword }
      });
      toast.success('Pengeluaran berhasil dihapus');
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      setDeletePassword('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus pengeluaran');
    }
  };

  const openDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpenseToDelete(id);
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const { formatCurrency, t } = React.useContext(CurrencyContext);

  return (
    <div className="mx-auto max-w-7xl font-sans relative">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('expense')}</h1>
          <p className="text-sm text-gray-400 font-bold mt-1">{t('expense_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors">
            <Plus size={16} />
            {t('add_expense')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-white/10 bg-black p-5 shadow-sm text-white">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_expense')}</p>
          <h3 className="text-3xl font-black tracking-tight">{formatCurrency(totalExpenses)}</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111120] p-5 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_transactions')}</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{expenses.length}</h3>
        </div>
      </div>

      {/* Budget Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-white tracking-tight uppercase text-xs text-gray-400">Batas Pengeluaran</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => {
            if (!cat.budget_limit) return null;
            
            const startDate = cat.budget_start_date ? new Date(cat.budget_start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endDate = cat.budget_end_date ? new Date(cat.budget_end_date) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            
            const currentPeriodExpenses = expenses.filter((e: any) => {
              const d = new Date(e.transaction_date);
              return e.category_id === cat.id && d >= startDate && d <= endDate;
            }).reduce((sum, e: any) => sum + Number(e.amount), 0);
            
            const budgetLimit = Number(cat.budget_limit);
            const percentage = Math.min(100, Math.round((currentPeriodExpenses / budgetLimit) * 100));
            const isWarning = percentage >= 80;
            const isDanger = percentage >= 100;
            
            let remainingDaysText = '';
            if (cat.budget_end_date) {
              const diffTime = Math.max(0, new Date(cat.budget_end_date).getTime() - new Date().getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              remainingDaysText = diffDays > 0 ? `Sisa ${diffDays} Hari` : 'Hari Terakhir';
            }
            
            return (
              <div key={cat.id} onClick={() => { 
                  setSelectedCategory(cat); 
                  setBudgetAmount(cat.budget_limit); 
                  setBudgetName(cat.budget_name || '');
                  setBudgetDuration('30');
                  setBudgetModalOpen(true); 
                }} className="rounded-xl border border-white/10 bg-[#111120] p-4 cursor-pointer hover:border-purple-500/50 transition-colors relative">
                
                {remainingDaysText && (
                  <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {remainingDaysText}
                  </span>
                )}
                
                <div className="flex flex-col mb-3">
                  <span className="font-black text-white text-base leading-tight mb-0.5">{cat.budget_name || 'Batas Pengeluaran'}</span>
                  <span className="text-xs font-bold text-gray-500">{cat.name}</span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                  <div className={`h-2.5 rounded-full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-purple-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span className={isDanger ? 'text-red-400' : 'text-gray-400'}>Terpakai: {formatCurrency(currentPeriodExpenses)}</span>
                  <span className="text-white">Batas: {formatCurrency(budgetLimit)}</span>
                </div>
              </div>
            );
          })}
          
          <button onClick={() => { 
              setSelectedCategory(categories[0]); 
              setBudgetAmount(''); 
              setBudgetName('');
              setBudgetDuration('30');
              setBudgetCustomDuration('');
              setBudgetModalOpen(true); 
            }} className="rounded-xl border border-dashed border-white/20 bg-transparent p-4 flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-white/50 transition-colors h-full min-h-[120px]">
            <Plus size={20} className="mb-1" />
            <span className="text-xs font-bold">Buat Batas Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-[#111120] shadow-none overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_expense')} 
              className="w-full rounded-lg border border-white/15 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-gray-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">Memuat...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111120] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5 text-xs">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('transaction_date')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('category')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('description')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Kwitansi</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 font-medium">
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-gray-500 bg-[#0f0f1a]">{t('no_expense_data')}</td></tr>
                ) : expenses.map((row, i) => (
                  <tr key={row.id || i} className="border-b border-white/5 last:border-0 hover:bg-purple-900/15 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-gray-400">{new Date(row.transaction_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">{row.category?.name}</td>
                    <td className="px-6 py-4 text-gray-400">{row.note}</td>
                    <td className="px-6 py-4">
                      {row.receipt ? (
                        <button onClick={(e) => { e.stopPropagation(); setViewImageUrl(row.receipt.startsWith('data:') ? row.receipt : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${row.receipt}`); }} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-xs font-bold">
                          <ImageIcon size={14} /> Lihat
                        </button>
                      ) : <span className="text-gray-500">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-black">{formatCurrency(Number(row.amount))}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={(e) => openDeleteModal(row.id, e)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111120] p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">{t('add_expense')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('amount')}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="cth. 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('category')}</label>
                <select 
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Pilih kategori...</option>
                  {['food', 'beauty', 'culture', 'health', 'gift', 'transportation', 'education', 'household', 'apparel'].map(key => (
                    <option key={key} value={key}>{t(key as any)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('transaction_date')}</label>
                <input 
                  type="date" 
                  required
                  value={formData.transaction_date}
                  onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('description')}</label>
                <input 
                  type="text" 
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="cth. Membeli perlengkapan kantor"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Foto Kwitansi/Kenangan (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full rounded-lg border border-white/15 p-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-300 hover:bg-[#1a1a2e]">Batal</button>
                <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700">{t('add_expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setViewImageUrl(null)}>
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewImageUrl(null)} className="absolute -top-12 right-0 text-white hover:text-purple-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 backdrop-blur-md">
              <X size={24} />
            </button>
            <img src={viewImageUrl} alt="Kwitansi / Kenangan" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#111120] p-6 shadow-xl border border-white/10">
            <h2 className="text-xl font-black text-white mb-2">Hapus Pengeluaran</h2>
            <p className="text-sm text-gray-400 font-medium mb-6">Untuk alasan keamanan, masukkan kata sandi akun Anda untuk mengonfirmasi penghapusan data ini.</p>
            <form onSubmit={handleDeleteExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Kata Sandi Akun</label>
                <input 
                  type="password" 
                  required
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 p-2.5 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors">Konfirmasi Hapus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Setting Modal */}
      {budgetModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#111120] p-6 shadow-xl border border-white/10">
            <h2 className="text-xl font-black text-white mb-2">Atur Batas Pengeluaran</h2>
            <p className="text-sm text-gray-400 font-medium mb-6">Untuk kategori <span className="text-white font-bold">{selectedCategory.name}</span></p>
            <form onSubmit={handleSetBudget} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Nama Target (Opsional)</label>
                <input 
                  type="text" 
                  value={budgetName}
                  onChange={e => setBudgetName(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                  placeholder="cth. Liburan Bali, Uang Makan"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Batas Anggaran (Rp)</label>
                <input 
                  type="number" 
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                  placeholder="Kosongkan untuk menghapus batas"
                />
              </div>
              {budgetAmount && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1.5">Durasi Waktu</label>
                    <select 
                      value={budgetDuration}
                      onChange={e => setBudgetDuration(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#111120] p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                    >
                      <option value="3">3 Hari</option>
                      <option value="7">1 Minggu</option>
                      <option value="30">1 Bulan</option>
                      <option value="custom">Bikin Sendiri (Kustom)</option>
                    </select>
                  </div>
                  {budgetDuration === 'custom' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-1.5">Jumlah Hari</label>
                      <input 
                        type="number" 
                        value={budgetCustomDuration}
                        onChange={e => setBudgetCustomDuration(e.target.value)}
                        required
                        className="w-full rounded-lg border border-white/15 bg-white/5 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                        placeholder="Masukkan jumlah hari (cth. 14)"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setBudgetModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-300 hover:bg-[#1a1a2e]">Batal</button>
                <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors">Simpan Anggaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpenseTracker;

import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { CurrencyContext } from '../context/CurrencyContext';

const IncomeTracker = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    note: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  const fetchData = async () => {
    try {
      const [incomesRes, catRes] = await Promise.all([
        axiosInstance.get('/finance/incomes'),
        axiosInstance.get('/finance/categories')
      ]);
      setIncomes(incomesRes.data);
      setCategories(catRes.data.filter((c: any) => c.type === 'income'));
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

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalDate = formData.transaction_date;
      const now = new Date();
      if (finalDate === now.toISOString().split('T')[0]) {
        finalDate = now.toISOString();
      }
      
      const dataToSubmit = { ...formData, transaction_date: finalDate };

      await axiosInstance.post('/finance/incomes', dataToSubmit);
      toast.success('Pemasukan berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({
        amount: '',
        category_id: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      fetchData(); // refresh data
    } catch (error) {
      toast.error('Gagal menambahkan pemasukan');
    }
  };

  const handleDeleteIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeToDelete || !deletePassword) return;

    try {
      await axiosInstance.delete(`/finance/incomes/${incomeToDelete}`, {
        data: { password: deletePassword }
      });
      toast.success('Pemasukan berhasil dihapus');
      setDeleteModalOpen(false);
      setIncomeToDelete(null);
      setDeletePassword('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus pemasukan');
    }
  };

  const openDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIncomeToDelete(id);
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const { formatCurrency, t } = React.useContext(CurrencyContext);

  return (
    <div className="mx-auto max-w-7xl font-sans relative">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('income')}</h1>
          <p className="text-sm text-gray-400 font-bold mt-1">{t('income_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors">
            <Plus size={16} />
            {t('add_income')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-white/10 bg-black p-5 shadow-sm text-white">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_income')}</p>
          <h3 className="text-3xl font-black tracking-tight">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111120] p-5 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_transactions')}</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{incomes.length}</h3>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-[#111120] shadow-none overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_income')} 
              className="w-full rounded-lg border border-white/15 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-gray-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">Memuat...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111120] border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('transaction_date')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('category')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('description')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 font-medium">
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-gray-500 bg-[#0f0f1a]">
                      {t('no_income_data')}
                    </td>
                  </tr>
                ) : incomes.map((row, i) => (
                  <tr key={row.id || i} className="border-b border-white/5 last:border-0 hover:bg-purple-900/15 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-gray-400">{new Date(row.transaction_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">{row.category?.name}</td>
                    <td className="px-6 py-4 text-gray-400">{row.note}</td>
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

      {/* Add Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111120] p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">{t('add_income')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddIncome} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('amount')}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder={t('eg_amount')}
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
                  <option value="">{t('select_category')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{t(c.name.toLowerCase() as any) || c.name}</option>)}
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
                <label className="mb-1 block text-sm font-bold text-gray-200">{t('description')}</label>
                <input 
                  type="text" 
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  className="w-full rounded-lg border border-white/15 p-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder={t('eg_desc_income')}
                />
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-300 hover:bg-[#1a1a2e]">{t('cancel')}</button>
                <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700">{t('add_income')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#111120] p-6 shadow-xl border border-white/10">
            <h2 className="text-xl font-black text-white mb-2">Hapus Pemasukan</h2>
            <p className="text-sm text-gray-400 font-medium mb-6">Untuk alasan keamanan, masukkan kata sandi akun Anda untuk mengonfirmasi penghapusan data ini.</p>
            <form onSubmit={handleDeleteIncome} className="flex flex-col gap-4">
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

    </div>
  );
};

export default IncomeTracker;

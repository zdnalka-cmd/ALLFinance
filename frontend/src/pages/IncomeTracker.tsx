import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Search, Trash2, Eye, EyeOff } from 'lucide-react';
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
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      toast.error(t('failed_load_data') + ': ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (action: string) => {
    toast(t('feature_coming_soon'), { icon: '🚧' });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === incomes.length && incomes.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(incomes.map(item => item.id));
    }
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
      toast.success(t('income_added_success'));
      setIsModalOpen(false);
      setFormData({
        amount: '',
        category_id: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      fetchData(); // refresh data
    } catch (error) {
      toast.error(t('income_added_failed'));
    }
  };

  const handleDeleteIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) return;

    try {
      if (incomeToDelete === 'bulk') {
        await axiosInstance.post('/finance/incomes/bulk-delete', {
          ids: selectedIds,
          password: deletePassword
        });
        toast.success(t('income_deleted_success'));
        setSelectedIds([]);
      } else if (incomeToDelete) {
        await axiosInstance.delete(`/finance/incomes/${incomeToDelete}`, {
          data: { password: deletePassword }
        });
        toast.success(t('income_deleted_success'));
      }
      
      setDeleteModalOpen(false);
      setIncomeToDelete(null);
      setDeletePassword('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('income_deleted_failed'));
    }
  };

  const openDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIncomeToDelete(id);
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const openBulkDeleteModal = () => {
    setIncomeToDelete('bulk');
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const { formatCurrency, t } = React.useContext(CurrencyContext);

  return (
    <div className="mx-auto max-w-7xl font-sans relative">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{t('income')}</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold mt-0.5">{t('income_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button onClick={openBulkDeleteModal} className="flex items-center gap-1.5 rounded-lg bg-red-600/20 text-red-500 px-3 sm:px-4 py-2 text-sm font-bold shadow-sm hover:bg-red-600/30 transition-colors">
              <Trash2 size={15} />
              <span className="hidden sm:inline">Hapus Terpilih ({selectedIds.length})</span>
              <span className="sm:hidden">({selectedIds.length})</span>
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 sm:px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors">
            <Plus size={15} />
            <span className="hidden sm:inline">{t('add_income')}</span>
            <span className="sm:hidden">+ {t('income')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl border border-white/10 bg-black p-4 sm:p-5 shadow-sm text-white col-span-1">
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_income')}</p>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight truncate">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111120] p-4 sm:p-5 shadow-sm col-span-1">
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_transactions')}</p>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{incomes.length}</h3>
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
            <table className="w-full text-left text-sm responsive-table">
              <thead className="bg-[#111120] border-b border-white/5">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900 cursor-pointer"
                      checked={incomes.length > 0 && selectedIds.length === incomes.length}
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('transaction_date')}</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t('description')}</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
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
                  <tr key={row.id || i} className={`border-b border-white/5 last:border-0 hover:bg-purple-900/15 transition-colors ${selectedIds.includes(row.id) ? 'bg-purple-900/20' : ''}`}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900 cursor-pointer"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelection(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-400 text-xs sm:text-sm" data-label={t('transaction_date')}>{new Date(row.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-400 text-xs sm:text-sm hidden sm:table-cell" data-label={t('description')}>{row.note || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-black text-sm sm:text-base" data-label={t('amount')}>{formatCurrency(Number(row.amount))}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center" data-label="Aksi">
                      <button onClick={(e) => openDeleteModal(row.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                        <Trash2 size={15} />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#111120] p-5 sm:p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-white">{t('add_income')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">✕</button>
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
            <h2 className="text-xl font-black text-white mb-2">
              {incomeToDelete === 'bulk' ? `Hapus ${selectedIds.length} Pemasukan` : t('delete_income')}
            </h2>
            <p className="text-sm text-gray-400 font-medium mb-6">{t('security_password_prompt')}</p>
            <form onSubmit={handleDeleteIncome} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">{t('account_password')}</label>
                <div className="relative">
                  <input 
                    type={showDeletePassword ? "text" : "password"} 
                    required
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 p-2.5 pr-10 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                  >
                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">{t('cancel')}</button>
                <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors">{t('confirm_delete')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default IncomeTracker;

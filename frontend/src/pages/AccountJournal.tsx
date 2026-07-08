import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { CurrencyContext } from '../context/CurrencyContext';

const AccountJournal = () => {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await axiosInstance.get('/finance/journals');
        setJournals(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Gagal memuat jurnal akun');
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, []);

  const { formatCurrency, t, currentCurrency } = React.useContext(CurrencyContext);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group journals by date
  const groupedJournals = useMemo(() => {
    const groups: Record<string, { income: number; expense: number }> = {};
    journals.forEach(j => {
      const localDate = new Date(j.date);
      const dateKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = { income: 0, expense: 0 };
      
      if (j.type === 'Asset') {
        groups[dateKey].income += Number(j.debit || 0);
      } else {
        groups[dateKey].expense += Number(j.credit || 0);
      }
    });
    return groups;
  }, [journals]);

  // Calculate monthly totals for the current viewed month
  const monthlyStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (groupedJournals[dateKey]) {
        income += groupedJournals[dateKey].income;
        expense += groupedJournals[dateKey].expense;
      }
    }
    
    return { income, expense, net: income - expense };
  }, [year, month, daysInMonth, groupedJournals]);

  // Locale-aware month and day names
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(currentCurrency.locale, { month: 'long' })
  );
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, 2 + i).toLocaleString(currentCurrency.locale, { weekday: 'short' })
  );

  const renderCalendarDays = () => {
    const cells = [];
    // Empty cells for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border border-white/5 bg-white/5 opacity-50 min-h-[100px] md:min-h-[120px] rounded-lg m-1"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = groupedJournals[dateKey] || { income: 0, expense: 0 };
      const net = dayData.income - dayData.expense;
      
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      cells.push(
        <div 
          key={day} 
          className={`relative p-2 border m-1 rounded-lg flex flex-col min-h-[100px] md:min-h-[120px] transition-all hover:bg-white/5 ${
            isToday ? 'border-purple-500 bg-purple-900/10' : 'border-white/10 bg-[#111120]'
          }`}
        >
          <span className={`absolute top-2 left-2 text-sm font-black ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>
            {day}
          </span>
          
          <div className="mt-7 flex flex-col gap-1 text-[10px] md:text-xs">
            {dayData.income > 0 && (
              <div className="flex justify-between items-center text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                <span className="hidden lg:inline">Pemasukan</span>
                <span className="lg:hidden">In</span>
                <span className="font-bold">+{formatCurrency(dayData.income)}</span>
              </div>
            )}
            {dayData.expense > 0 && (
              <div className="flex justify-between items-center text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">
                <span className="hidden lg:inline">Pengeluaran</span>
                <span className="lg:hidden">Out</span>
                <span className="font-bold">-{formatCurrency(dayData.expense)}</span>
              </div>
            )}
            
            {(dayData.income > 0 || dayData.expense > 0) && (
              <div className="mt-1 pt-1 border-t border-white/10 flex justify-end">
                <span className={`font-black ${net >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {formatCurrency(net)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return cells;
  };

  return (
    <div className="mx-auto max-w-7xl font-sans pb-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('daily_journal')}</h1>
          <p className="text-sm text-gray-400 font-bold mt-1">{t('journal_subtitle')}</p>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-4 bg-[#111120] p-1.5 rounded-lg border border-white/10">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-2 text-white font-bold w-40 justify-center">
            <CalendarIcon size={16} className="text-purple-500" />
            <span>{monthNames[month]} {year}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#111120] to-[#15152a] p-5 rounded-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm font-bold mb-1 relative z-10">{t('monthly_income')}</p>
          <h3 className="text-2xl font-black text-emerald-400 relative z-10">{formatCurrency(monthlyStats.income)}</h3>
        </div>
        <div className="bg-gradient-to-br from-[#111120] to-[#15152a] p-5 rounded-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm font-bold mb-1 relative z-10">{t('monthly_expense')}</p>
          <h3 className="text-2xl font-black text-rose-400 relative z-10">{formatCurrency(monthlyStats.expense)}</h3>
        </div>
        <div className="bg-gradient-to-br from-[#111120] to-[#15152a] p-5 rounded-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm font-bold mb-1 relative z-10">{t('net_balance')}</p>
          <h3 className={`text-2xl font-black relative z-10 ${monthlyStats.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(monthlyStats.net)}
          </h3>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#111120] rounded-xl border border-white/10 p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {loading ? (
            <div className="py-20 flex justify-center items-center text-gray-400 font-bold">
              {t('loading_dashboard')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center py-2 text-xs font-black text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {renderCalendarDays()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountJournal;

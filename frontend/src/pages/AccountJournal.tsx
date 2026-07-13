import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, CalendarDays, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { CurrencyContext } from '../context/CurrencyContext';

const AccountJournal = () => {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await axiosInstance.get('/finance/journals');
        setJournals(res.data);
      } catch (error) {
        console.error(error);
        toast.error(t('failed_load_data'));
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

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

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

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(currentCurrency.locale, { month: 'long' })
  );
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, 2 + i).toLocaleString(currentCurrency.locale, { weekday: 'short' })
  );

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Selected day info
  const selectedDateKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedDayData = selectedDateKey ? groupedJournals[selectedDateKey] : null;

  const renderCalendarDays = () => {
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = groupedJournals[dateKey] || { income: 0, expense: 0 };
      const net = dayData.income - dayData.expense;
      const hasData = dayData.income > 0 || dayData.expense > 0;
      const isToday = isCurrentMonth && today.getDate() === day;
      const isSelected = selectedDay === day;

      let dotColor = '';
      if (hasData) {
        dotColor = net >= 0 ? 'bg-emerald-400' : 'bg-rose-400';
      }

      cells.push(
        <div
          key={day}
          onClick={() => setSelectedDay(isSelected ? null : day)}
          className={`
            aspect-square relative flex flex-col items-center justify-start pt-2 rounded-xl cursor-pointer
            transition-all duration-200 select-none group
            ${isSelected
              ? 'bg-purple-600 shadow-lg shadow-purple-900/40 scale-105'
              : isToday
                ? 'bg-purple-900/30 border border-purple-500/60'
                : hasData
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  : 'hover:bg-white/5 border border-transparent hover:border-white/5'
            }
          `}
        >
          <span className={`text-sm font-bold leading-none transition-colors ${
            isSelected ? 'text-white' : isToday ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-200'
          }`}>
            {day}
          </span>

          {/* Data dots */}
          {hasData && (
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
              {dayData.income > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
              )}
              {dayData.expense > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-sm shadow-rose-500/50" />
              )}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="mx-auto max-w-5xl font-sans pb-10">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={20} className="text-purple-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">{t('daily_journal')}</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">{t('journal_subtitle')}</p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-[#111120] px-3 py-2 rounded-xl border border-white/10">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
            <span className="text-white font-bold text-sm">{monthNames[month]}</span>
            <span className="text-purple-400 font-black text-sm">{year}</span>
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/60 to-[#111120] p-3 sm:p-5 group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3 relative z-10">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp size={12} className="text-emerald-400" />
            </div>
            <p className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{t('income')}</p>
          </div>
          <h3 className="font-black text-emerald-400 relative z-10 leading-tight break-all"
            style={{ fontSize: formatCurrency(monthlyStats.income).length > 10 ? '0.7rem' : formatCurrency(monthlyStats.income).length > 7 ? '0.875rem' : '1.125rem' }}>
            {formatCurrency(monthlyStats.income)}
          </h3>
          <p className="text-[9px] text-gray-600 font-medium mt-1 relative z-10 hidden sm:block">{t('month_word')} {monthNames[month]}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/60 to-[#111120] p-3 sm:p-5 group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3 relative z-10">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <TrendingDown size={12} className="text-rose-400" />
            </div>
            <p className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{t('expense')}</p>
          </div>
          <h3 className="font-black text-rose-400 relative z-10 leading-tight break-all"
            style={{ fontSize: formatCurrency(monthlyStats.expense).length > 10 ? '0.7rem' : formatCurrency(monthlyStats.expense).length > 7 ? '0.875rem' : '1.125rem' }}>
            {formatCurrency(monthlyStats.expense)}
          </h3>
          <p className="text-[9px] text-gray-600 font-medium mt-1 relative z-10 hidden sm:block">{t('month_word')} {monthNames[month]}</p>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-3 sm:p-5 group ${
          monthlyStats.net >= 0
            ? 'border-purple-500/20 bg-gradient-to-br from-purple-950/60 to-[#111120]'
            : 'border-rose-500/20 bg-gradient-to-br from-rose-950/40 to-[#111120]'
        }`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${
            monthlyStats.net >= 0 ? 'bg-purple-500/10 group-hover:bg-purple-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'
          }`} />
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3 relative z-10">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${
              monthlyStats.net >= 0 ? 'bg-purple-500/20' : 'bg-rose-500/20'
            }`}>
              <Wallet size={12} className={monthlyStats.net >= 0 ? 'text-purple-400' : 'text-rose-400'} />
            </div>
            <p className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{t('net_balance')}</p>
          </div>
          {(() => {
            const netStr = formatCurrency(Math.abs(monthlyStats.net));
            return (
              <h3 className={`font-black relative z-10 leading-tight break-all ${monthlyStats.net >= 0 ? 'text-white' : 'text-rose-400'}`}
                style={{ fontSize: netStr.length > 10 ? '0.7rem' : netStr.length > 7 ? '0.875rem' : '1.125rem' }}>
                {monthlyStats.net < 0 ? '-' : ''}{netStr}
              </h3>
            );
          })()}
          <p className="text-[9px] text-gray-600 font-medium mt-1 relative z-10 hidden sm:block">
            {monthlyStats.net >= 0 ? `✓ ${t('surplus')}` : `⚠ ${t('deficit')}`}
          </p>
        </div>
      </div>

      {/* Main Calendar + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-[#0d0d1a] rounded-2xl border border-white/10 p-5">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500 font-bold">Memuat kalender...</div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-3 gap-1">
                {dayNames.map((d, i) => (
                  <div key={d} className={`text-center py-1 text-[11px] font-black uppercase tracking-widest ${
                    i === 0 ? 'text-rose-500/70' : i === 6 ? 'text-blue-400/70' : 'text-gray-600'
                  }`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {renderCalendarDays()}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/60" />
                  <span className="text-[11px] text-gray-500 font-medium">{t('income')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-500/60" />
                  <span className="text-[11px] text-gray-500 font-medium">{t('expense')}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="w-3 h-3 rounded-md bg-purple-600/80" />
                  <span className="text-[11px] text-gray-500 font-medium">{t('selected')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Side Detail Panel */}
        <div className="bg-[#0d0d1a] rounded-2xl border border-white/10 p-5 flex flex-col">
          {selectedDay && selectedDayData ? (
            <>
              {/* Selected day with data */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                  <span className="text-white font-black text-lg">{selectedDay}</span>
                </div>
                <div>
                  <p className="text-white font-black text-base">{selectedDay} {monthNames[month]}</p>
                  <p className="text-gray-500 text-xs font-medium">{year}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {selectedDayData.income > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <p className="text-[11px] text-emerald-500/80 font-bold uppercase tracking-wider">{t('income')}</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-400">+{formatCurrency(selectedDayData.income)}</p>
                  </div>
                )}

                {selectedDayData.expense > 0 && (
                  <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={14} className="text-rose-400" />
                      <p className="text-[11px] text-rose-500/80 font-bold uppercase tracking-wider">{t('expense')}</p>
                    </div>
                    <p className="text-2xl font-black text-rose-400">-{formatCurrency(selectedDayData.expense)}</p>
                  </div>
                )}

                {/* Net */}
                <div className="mt-auto pt-4 border-t border-white/5">
                  <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider mb-1">{t('today_balance')}</p>
                  <p className={`text-xl font-black ${(selectedDayData.income - selectedDayData.expense) >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {formatCurrency(selectedDayData.income - selectedDayData.expense)}
                  </p>
                </div>
              </div>
            </>
          ) : selectedDay ? (
            /* Selected day without data */
            <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 mx-auto">
                <span className="text-white font-black text-xl">{selectedDay}</span>
              </div>
              <p className="text-gray-400 font-bold text-sm">{selectedDay} {monthNames[month]} {year}</p>
              <p className="text-gray-600 text-xs font-medium mt-1">{t('no_transactions_today')}</p>
            </div>
          ) : (
            /* No selection */
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-purple-500" />
              </div>
              <p className="text-gray-400 font-bold text-sm">{t('select_date')}</p>
              <p className="text-gray-600 text-xs font-medium mt-2 leading-relaxed">
                {t('click_date_hint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountJournal;

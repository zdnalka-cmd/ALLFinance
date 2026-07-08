import React, { useState, useEffect, useContext } from 'react';
import {
  ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Sparkles, Pencil, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';

// Predefined expense category colors (Jewel tones - darker multi-color palette)
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

const Dashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  const { currentCurrency, formatCurrency: contextFormatCurrency, t } = useContext(CurrencyContext);
  const formatCurrency = (val: number) => contextFormatCurrency(val, true);

  const dashboardName = user?.dashboard_name || t('dashboard');

  const handleSaveName = async () => {
    try {
      const res = await axiosInstance.put('/auth/profile', { dashboard_name: editName });
      if (user) updateUser(res.data.user);
      setIsEditingName(false);
      toast.success('Nama dasbor berhasil diperbarui');
    } catch {
      toast.error('Gagal memperbarui nama dasbor');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/finance/dashboard');
      setDashboardData(response.data);
    } catch {
      toast.error('Gagal memuat data dasbor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const composedData = dashboardData?.chartData || [];

  // Income vs Expense donut data
  const pieData = [
    { name: t('total_income'), value: dashboardData?.totals?.totalRevenue || 0, color: '#10b981' },
    { name: t('total_expense'), value: dashboardData?.totals?.totalExpenses || 0, color: '#ef4444' }
  ];

  // Expense by category donut data – strictly real API data
  const rawCategoryData: { name: string; value: number }[] = dashboardData?.expenseByCategory || [];

  const expenseCatData = rawCategoryData.map((d, i) => {
    const key = d.name.toLowerCase();
    const translated = t(key as any) ?? d.name;
    const color = EXPENSE_CAT_COLORS[key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
    return { ...d, displayName: translated, color };
  });

  // Metric Card component
  const MetricCard = ({ title, value, subtext }: { title: string; value: string; subtext?: string }) => (
    <div className="rounded-xl border border-white/10 bg-[#111120] p-5 shadow-sm flex flex-col justify-center hover:border-purple-500/40 transition-all group">
      <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{title}</p>
      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">{value}</h3>
      {subtext && <p className="text-xs text-gray-500 font-medium mt-1">{subtext}</p>}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-bold text-gray-400">{t('loading_dashboard')}</p></div>;

  return (
    <div className="mx-auto max-w-7xl font-sans pb-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isEditingName ? (
                <input
                  autoFocus type="text" value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown} onBlur={handleSaveName}
                  className="text-2xl font-black text-white bg-transparent border-b border-purple-500 focus:outline-none tracking-tight"
                />
              ) : (
                <>
                  <h1 className="text-2xl font-black text-white tracking-tight">{dashboardName}</h1>
                  <button onClick={() => { setEditName(dashboardName); setIsEditingName(true); }} className="text-gray-500 hover:text-purple-400 transition-colors">
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-purple-500" />
                <span>{t('financial_report')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-purple-500" />
                <span>{t('finance')}</span>
              </div>
            </div>
          </div>
          <button onClick={() => window.open('https://gemini.google.com/', '_blank')} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors">
            <Sparkles size={15} />
            {t('ai_help')}
          </button>
        </div>
        <p className="text-sm text-gray-500">{t('welcome_tagline')}</p>
      </div>

      {/* Metric Cards */}
      <div className="mb-6">
        <h2 className="text-base font-black text-white tracking-tight mb-4 uppercase text-xs text-gray-400">{t('all_totals')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title={t('total_income')} value={formatCurrency(dashboardData?.totals?.totalRevenue || 0)} subtext={t('income_ytd')} />
          <MetricCard title={t('total_expense')} value={formatCurrency(dashboardData?.totals?.totalExpenses || 0)} subtext={t('expense_ytd')} />
          <MetricCard title={t('net_profit')} value={formatCurrency(dashboardData?.totals?.netProfit || 0)} />
          <MetricCard title={t('gross_profit')} value={formatCurrency(dashboardData?.totals?.grossProfit || 0)} />
        </div>
      </div>

      {/* Main Bar Chart — full width */}
      <div className="rounded-xl border border-white/10 bg-[#111120] p-6 mb-6">
        <h3 className="font-black text-white mb-2">{t('revenue_expense_12m')}</h3>
        <div className="flex flex-wrap gap-5 mb-5 text-xs font-bold uppercase tracking-wider text-gray-400">
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#10b981]" />{t('revenue')}</div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#ef4444]" />{t('total_expense')}</div>
          <div className="flex items-center gap-2"><div className="h-0.5 w-4 bg-[#a855f7]" />{t('operating_margin')}</div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={composedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(val) => `${currentCurrency.symbol}${val >= 1000 ? (val/1000).toFixed(0)+'K' : val}`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} />
              <RechartsTooltip cursor={{ fill: 'rgba(134,59,255,0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(134,59,255,0.3)', background: '#0d0d1a', color: '#e9d5ff', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="revenue" fill="#10b981" barSize={14} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" barSize={14} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#a855f7" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#a855f7' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: 3 columns — Line Chart | Income vs Expense Donut | Expense Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Line Chart: Gross Profit */}
        <div className="rounded-xl border border-white/10 bg-[#111120] p-6 flex flex-col">
          <h3 className="font-black text-white mb-1 text-sm">{t('gross_profit_12m')}</h3>
          <div className="flex flex-wrap gap-4 mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="flex items-center gap-2"><div className="h-0.5 w-4 bg-[#863bff]" />{t('gross_profit_line')}</div>
            <div className="flex items-center gap-2"><div className="h-0.5 w-4 bg-[#10b981]" />{t('gross_margin')}</div>
          </div>
          <div className="h-52 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={composedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} dy={8} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(val) => `${currentCurrency.symbol}${val >= 1000 ? (val/1000).toFixed(0)+'K' : val}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(134,59,255,0.3)', background: '#0d0d1a', color: '#e9d5ff', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#863bff" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart 1: Income vs Expense */}
        <div className="rounded-xl border border-white/10 bg-[#111120] p-6 flex flex-col">
          <h3 className="font-black text-white mb-4 text-sm">{t('income_expense_comparison')}</h3>
          <div className="flex flex-col items-center flex-1">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(134,59,255,0.3)', background: '#0d0d1a', color: '#e9d5ff', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="font-medium text-gray-300">{entry.name}</span>
                  </div>
                  <span className="font-black text-gray-200">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart 2: Expense by Category */}
        <div className="rounded-xl border border-white/10 bg-[#111120] p-6 flex flex-col">
          <h3 className="font-black text-white mb-4 text-sm">{t('expense_by_category')}</h3>
          {expenseCatData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseCatData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="displayName" stroke="none">
                    {expenseCatData.map((entry, index) => <Cell key={`cat-${index}`} fill={entry.color} />)}
                  </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name: any) => [
                        formatCurrency(value),
                        name === 'Pemasukan' ? t('income') : t('expense')
                      ]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(134,59,255,0.3)', background: '#0d0d1a', color: '#e9d5ff', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: 11 }}
                    />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 w-full flex items-center justify-center text-xs font-bold text-gray-500">
              Belum ada data pengeluaran
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 overflow-y-auto max-h-28 pr-1">
            {expenseCatData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate text-gray-300 font-medium">{entry.displayName}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

import React, { createContext, useState, type ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  locale: string;
  name: string;
  flag: string;
  lang: 'id' | 'en' | 'ja' | 'ms';
}

export const currencies: Currency[] = [
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Rupiah', flag: '🇮🇩', lang: 'id' },
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', flag: '🇺🇸', lang: 'en' },
  { code: 'EUR', symbol: '€', locale: 'en-IE', name: 'Euro', flag: '🇪🇺', lang: 'en' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Yen', flag: '🇯🇵', lang: 'ja' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'Pound', flag: '🇬🇧', lang: 'en' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar', flag: '🇸🇬', lang: 'en' },
  { code: 'MYR', symbol: 'RM', locale: 'ms-MY', name: 'Ringgit', flag: '🇲🇾', lang: 'ms' },
];

// Translation dictionary
export type TranslationKey =
  | 'dashboard' | 'income' | 'expense' | 'contact' | 'daily_journal'
  | 'total_income' | 'total_expense' | 'net_profit' | 'gross_profit'
  | 'financial_report' | 'finance' | 'welcome_tagline'
  | 'all_totals' | 'income_ytd' | 'expense_ytd'
  | 'revenue_expense_12m' | 'revenue' | 'operating_margin'
  | 'gross_profit_12m' | 'gross_profit_line' | 'gross_margin'
  | 'income_expense_comparison' | 'expense_by_category'
  | 'loading_dashboard' | 'ai_help' | 'logout'
  | 'food' | 'beauty' | 'culture' | 'health' | 'gift'
  | 'transportation' | 'education' | 'household' | 'apparel'
  | 'monthly_income' | 'monthly_expense' | 'net_balance'
  | 'journal_subtitle' | 'calendar_prev' | 'calendar_next'
  | 'income_subtitle' | 'add_income' | 'total_transactions'
  | 'search_income' | 'transaction_date' | 'category'
  | 'description' | 'amount' | 'no_income_data'
  | 'expense_subtitle' | 'add_expense' | 'search_expense' | 'no_expense_data'
  | 'contact_subtitle' | 'add_contact' | 'total_contacts'
  | 'search_contact' | 'contact_name' | 'contact_info'
  | 'address' | 'no_contact_data' | 'actions';

export type Translations = Record<TranslationKey, string>;

const translations: Record<'id' | 'en' | 'ja' | 'ms', Translations> = {
  id: {
    dashboard: 'Halaman Utama',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    contact: 'Kontak',
    daily_journal: 'Kalender Daily',
    total_income: 'Total Pendapatan',
    total_expense: 'Total Pengeluaran',
    net_profit: 'Sisa Saldo / Uang Tersisa',
    gross_profit: 'Laba Kotor',
    financial_report: 'Laporan',
    finance: 'Keuangan',
    welcome_tagline: 'Selamat datang di AllFinance, platform manajemen keuangan pintar Anda. Pantau dan kelola aset dengan lebih mudah.',
    all_totals: 'Semua Total Perhitungan',
    income_ytd: 'Pendapatan (YTD)',
    expense_ytd: 'Pengeluaran (YTD)',
    revenue_expense_12m: 'Pendapatan Operasional dan Pengeluaran (12 bulan terakhir)',
    revenue: 'Pendapatan',
    operating_margin: 'Margin Operasional',
    gross_profit_12m: 'Laba Kotor 12 Bulan Terakhir',
    gross_profit_line: 'Laba Kotor',
    gross_margin: 'Margin Kotor',
    income_expense_comparison: 'Perbandingan Pemasukan & Pengeluaran',
    expense_by_category: 'Pengeluaran per Kategori',
    loading_dashboard: 'Memuat Dasbor...',
    ai_help: 'Bantuan AI',
    logout: 'Keluar',
    food: 'Makanan',
    beauty: 'Kecantikan',
    culture: 'Budaya',
    health: 'Kesehatan',
    gift: 'Hadiah',
    transportation: 'Transportasi',
    education: 'Pendidikan',
    household: 'Rumah Tangga',
    apparel: 'Pakaian',
    monthly_income: 'Total Pemasukan Bulan Ini',
    monthly_expense: 'Total Pengeluaran Bulan Ini',
    net_balance: 'Total Saldo Bersih',
    journal_subtitle: 'Ringkasan transaksi keuangan harian',
    calendar_prev: 'Bulan Sebelumnya',
    calendar_next: 'Bulan Berikutnya',
    income_subtitle: 'Lacak dan kelola sumber pendapatan Anda',
    add_income: 'Tambah Pemasukan',
    total_transactions: 'Total Transaksi',
    search_income: '🔍 Cari pemasukan...',
    transaction_date: 'Tanggal Transaksi',
    category: 'Kategori',
    description: 'Keterangan',
    amount: 'Jumlah',
    no_income_data: 'Belum ada data pemasukan',
    expense_subtitle: 'Lacak dan kelola pengeluaran Anda',
    add_expense: 'Tambah Pengeluaran',
    search_expense: '🔍 Cari pengeluaran...',
    no_expense_data: 'Belum ada data pengeluaran',
    contact_subtitle: 'Kelola kontak dan rekan bisnis Anda',
    add_contact: 'Tambah Kontak',
    total_contacts: 'Total Kontak',
    search_contact: '🔍 Cari kontak...',
    contact_name: 'Nama Kontak',
    contact_info: 'Informasi Kontak',
    address: 'Alamat',
    no_contact_data: 'Belum ada kontak',
    actions: 'Aksi',
  },
  en: {
    dashboard: 'Dashboard',
    income: 'Income',
    expense: 'Expenses',
    contact: 'Contacts',
    daily_journal: 'Daily Journal',
    total_income: 'Total Revenue',
    total_expense: 'Total Expenses',
    net_profit: 'Remaining Balance',
    gross_profit: 'Gross Profit',
    financial_report: 'Report',
    finance: 'Finance',
    welcome_tagline: 'Welcome to AllFinance, your smart financial management platform. Monitor and manage your assets with ease.',
    all_totals: 'All Total Calculations',
    income_ytd: 'Revenue (YTD)',
    expense_ytd: 'Expenses (YTD)',
    revenue_expense_12m: 'Operating Revenue and Expenses (last 12 months)',
    revenue: 'Revenue',
    operating_margin: 'Operating Margin',
    gross_profit_12m: 'Gross Profit Last 12 Months',
    gross_profit_line: 'Gross Profit',
    gross_margin: 'Gross Margin',
    income_expense_comparison: 'Income & Expense Comparison',
    expense_by_category: 'Expenses by Category',
    loading_dashboard: 'Loading Dashboard...',
    ai_help: 'AI Help',
    logout: 'Logout',
    food: 'Food',
    beauty: 'Beauty',
    culture: 'Culture',
    health: 'Health',
    gift: 'Gift',
    transportation: 'Transportation',
    education: 'Education',
    household: 'Household',
    apparel: 'Apparel',
    monthly_income: 'Total Income This Month',
    monthly_expense: 'Total Expenses This Month',
    net_balance: 'Total Net Balance',
    journal_subtitle: 'Summary of daily financial transactions',
    calendar_prev: 'Previous Month',
    calendar_next: 'Next Month',
    income_subtitle: 'Track and manage your income sources',
    add_income: 'Add Income',
    total_transactions: 'Total Transactions',
    search_income: '🔍 Search income...',
    transaction_date: 'Transaction Date',
    category: 'Category',
    description: 'Description',
    amount: 'Amount',
    no_income_data: 'No income data yet',
    expense_subtitle: 'Track and manage your expenses',
    add_expense: 'Add Expense',
    search_expense: '🔍 Search expenses...',
    no_expense_data: 'No expense data yet',
    contact_subtitle: 'Manage your contacts and business partners',
    add_contact: 'Add Contact',
    total_contacts: 'Total Contacts',
    search_contact: '🔍 Search contacts...',
    contact_name: 'Contact Name',
    contact_info: 'Contact Info',
    address: 'Address',
    no_contact_data: 'No contacts yet',
    actions: 'Actions',
  },
  ja: {
    dashboard: 'ダッシュボード',
    income: '収入',
    expense: '支出',
    contact: '連絡先',
    daily_journal: 'デイリー帳',
    total_income: '総収益',
    total_expense: '総支出',
    net_profit: '純利益',
    gross_profit: '粗利益',
    financial_report: 'レポート',
    finance: '財務',
    welcome_tagline: 'AllFinanceへようこそ。スマートな財務管理プラットフォームで資産を監視・管理しましょう。',
    all_totals: '全合計',
    income_ytd: '収益 (YTD)',
    expense_ytd: '支出 (YTD)',
    revenue_expense_12m: '営業収益と支出（過去12ヶ月）',
    revenue: '収益',
    operating_margin: '営業利益率',
    gross_profit_12m: '過去12ヶ月の粗利益',
    gross_profit_line: '粗利益',
    gross_margin: '粗利益率',
    income_expense_comparison: '収入と支出の比較',
    expense_by_category: 'カテゴリ別支出',
    loading_dashboard: 'ダッシュボード読込中...',
    ai_help: 'AIサポート',
    logout: 'ログアウト',
    food: '食料',
    beauty: '美容',
    culture: '文化',
    health: '健康',
    gift: 'ギフト',
    transportation: '交通',
    education: '教育',
    household: '家事',
    apparel: '衣料',
    monthly_income: '今月の総収入',
    monthly_expense: '今月の総支出',
    net_balance: '純残高',
    journal_subtitle: '日次財務取引のサマリー',
    calendar_prev: '前月',
    calendar_next: '翌月',
    income_subtitle: '収入源の追跡と管理',
    add_income: '収入を追加',
    total_transactions: '総取引数',
    search_income: '🔍 収入を検索...',
    transaction_date: '取引日',
    category: 'カテゴリー',
    description: '説明',
    amount: '金額',
    no_income_data: 'まだ収入データはありません',
    expense_subtitle: '支出の追跡と管理',
    add_expense: '支出を追加',
    search_expense: '🔍 支出を検索...',
    no_expense_data: 'まだ支出データはありません',
    contact_subtitle: '連絡先とビジネスパートナーの管理',
    add_contact: '連絡先を追加',
    total_contacts: '総連絡先',
    search_contact: '🔍 連絡先を検索...',
    contact_name: '連絡先名',
    contact_info: '連絡先情報',
    address: '住所',
    no_contact_data: 'まだ連絡先はありません',
    actions: 'アクション',
  },
  ms: {
    dashboard: 'Papan Pemuka',
    income: 'Pendapatan',
    expense: 'Perbelanjaan',
    contact: 'Kenalan',
    daily_journal: 'Jurnal Harian',
    total_income: 'Jumlah Pendapatan',
    total_expense: 'Jumlah Perbelanjaan',
    net_profit: 'Keuntungan Bersih',
    gross_profit: 'Keuntungan Kasar',
    financial_report: 'Laporan',
    finance: 'Kewangan',
    welcome_tagline: 'Selamat datang ke AllFinance, platform pengurusan kewangan pintar anda. Pantau dan urus aset anda dengan lebih mudah.',
    all_totals: 'Semua Jumlah Kiraan',
    income_ytd: 'Pendapatan (YTD)',
    expense_ytd: 'Perbelanjaan (YTD)',
    revenue_expense_12m: 'Hasil Operasi dan Perbelanjaan (12 bulan lepas)',
    revenue: 'Hasil',
    operating_margin: 'Margin Operasi',
    gross_profit_12m: 'Keuntungan Kasar 12 Bulan Lepas',
    gross_profit_line: 'Keuntungan Kasar',
    gross_margin: 'Margin Kasar',
    income_expense_comparison: 'Perbandingan Pendapatan & Perbelanjaan',
    expense_by_category: 'Perbelanjaan mengikut Kategori',
    loading_dashboard: 'Memuatkan Papan Pemuka...',
    ai_help: 'Bantuan AI',
    logout: 'Log Keluar',
    food: 'Makanan',
    beauty: 'Kecantikan',
    culture: 'Budaya',
    health: 'Kesihatan',
    gift: 'Hadiah',
    transportation: 'Pengangkutan',
    education: 'Pendidikan',
    household: 'Isi Rumah',
    apparel: 'Pakaian',
    monthly_income: 'Jumlah Pendapatan Bulan Ini',
    monthly_expense: 'Jumlah Perbelanjaan Bulan Ini',
    net_balance: 'Baki Bersih',
    journal_subtitle: 'Ringkasan transaksi kewangan harian',
    calendar_prev: 'Bulan Lepas',
    calendar_next: 'Bulan Seterusnya',
    income_subtitle: 'Jejak dan urus sumber pendapatan anda',
    add_income: 'Tambah Pendapatan',
    total_transactions: 'Jumlah Transaksi',
    search_income: '🔍 Cari pendapatan...',
    transaction_date: 'Tarikh Transaksi',
    category: 'Kategori',
    description: 'Keterangan',
    amount: 'Jumlah',
    no_income_data: 'Tiada data pendapatan lagi',
    expense_subtitle: 'Jejak dan urus perbelanjaan anda',
    add_expense: 'Tambah Perbelanjaan',
    search_expense: '🔍 Cari perbelanjaan...',
    no_expense_data: 'Tiada data perbelanjaan lagi',
    contact_subtitle: 'Urus kenalan dan rakan kongsi perniagaan anda',
    add_contact: 'Tambah Kenalan',
    total_contacts: 'Jumlah Kenalan',
    search_contact: '🔍 Cari kenalan...',
    contact_name: 'Nama Kenalan',
    contact_info: 'Maklumat Kenalan',
    address: 'Alamat',
    no_contact_data: 'Tiada kenalan lagi',
    actions: 'Tindakan',
  },
};

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrentCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, compact?: boolean) => string;
  t: (key: TranslationKey) => string;
}

export const CurrencyContext = createContext<CurrencyContextType>({
  currentCurrency: currencies[0],
  setCurrentCurrency: () => {},
  formatCurrency: () => '',
  t: (key) => key,
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currentCurrency, setCurrentCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('app_currency');
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return currencies[0];
  });

  const setCurrentCurrency = (currency: Currency) => {
    setCurrentCurrencyState(currency);
    localStorage.setItem('app_currency', currency.code);
  };

  const formatCurrency = (amount: number, compact: boolean = false) => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currentCurrency.code,
      minimumFractionDigits: compact ? 0 : (currentCurrency.code === 'IDR' || currentCurrency.code === 'JPY' ? 0 : 2),
      maximumFractionDigits: compact ? 1 : (currentCurrency.code === 'IDR' || currentCurrency.code === 'JPY' ? 0 : 2),
    };

    if (compact) {
      options.notation = 'compact';
      options.compactDisplay = 'short';
    }

    return new Intl.NumberFormat(currentCurrency.locale, options).format(amount);
  };

  const t = (key: TranslationKey): string => {
    const langTranslations = translations[currentCurrency.lang];
    return langTranslations[key] ?? key;
  };

  return (
    <CurrencyContext.Provider value={{ currentCurrency, setCurrentCurrency, formatCurrency, t }}>
      {children}
    </CurrencyContext.Provider>
  );
};

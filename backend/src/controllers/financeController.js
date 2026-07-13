const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

// --- Categories ---
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { user_id: null }
        ]
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Incomes ---
exports.getIncomes = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      where: { user_id: req.user.id },
      include: {
        category: true,
        customer: true
      },
      orderBy: { transaction_date: 'desc' }
    });
    res.json(incomes);
  } catch (error) {
    console.error('[GET /incomes] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.addIncome = async (req, res) => {
  try {
    let { amount, category_id, payment_method, note, transaction_date } = req.body;
    
    // Auto-assign default category if not provided from frontend
    if (!category_id) {
      let defaultCat = await prisma.category.findFirst({
        where: { name: 'Pemasukan Umum', type: 'income', OR: [{ user_id: req.user.id }, { user_id: null }] }
      });
      if (!defaultCat) {
        defaultCat = await prisma.category.create({
          data: { name: 'Pemasukan Umum', type: 'income', user_id: req.user.id }
        });
      }
      category_id = defaultCat.id;
    }

    const income = await prisma.income.create({
      data: {
        user_id: req.user.id,
        amount: parseFloat(amount),
        category_id,
        payment_method: payment_method || 'Cash',
        note,
        transaction_date: new Date(transaction_date)
      },
      include: { category: true }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        user_id: req.user.id,
        message: `NEW_INCOME|${income.amount}|${income.category?.name || 'Lainnya'}`,
        type: 'income'
      }
    });

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Sandi akun diperlukan untuk menghapus pemasukan' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi salah. Penghapusan dibatalkan demi keamanan.' });
    }

    const existingIncome = await prisma.income.findFirst({
      where: { id, user_id: req.user.id }
    });

    if (!existingIncome) {
      return res.status(404).json({ error: 'Data pemasukan tidak ditemukan' });
    }

    await prisma.income.delete({
      where: { id }
    });

    res.json({ message: 'Data pemasukan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkDeleteIncomes = async (req, res) => {
  try {
    const { ids, password } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang dipilih untuk dihapus' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Sandi akun diperlukan untuk menghapus pemasukan' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi salah. Penghapusan dibatalkan demi keamanan.' });
    }

    const result = await prisma.income.deleteMany({
      where: { 
        id: { in: ids },
        user_id: req.user.id
      }
    });

    res.json({ message: `${result.count} data pemasukan berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Expenses ---
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { user_id: req.user.id },
      include: {
        category: true,
        supplier: true
      },
      orderBy: { transaction_date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    let { amount, category_id, note, transaction_date } = req.body; // category_id from frontend will be the category name (e.g. 'food')
    let receiptUrl = null;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      receiptUrl = `data:${req.file.mimetype};base64,${b64}`;
    }

    let actualCategory = await prisma.category.findFirst({
      where: { name: category_id, type: 'expense', user_id: req.user.id }
    });
    if (!actualCategory) {
      actualCategory = await prisma.category.findFirst({
        where: { name: category_id, type: 'expense', user_id: null }
      });
      if (!actualCategory) {
        actualCategory = await prisma.category.create({
          data: { name: category_id, type: 'expense', user_id: req.user.id }
        });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        user_id: req.user.id,
        amount: parseFloat(amount),
        category_id: actualCategory.id,
        note,
        receipt: receiptUrl,
        transaction_date: new Date(transaction_date)
      },
      include: { category: true }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        user_id: req.user.id,
        message: `NEW_EXPENSE|${expense.amount}|${expense.category?.name || 'Lainnya'}`,
        type: 'expense'
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Sandi akun diperlukan untuk menghapus pengeluaran' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi salah. Penghapusan dibatalkan demi keamanan.' });
    }

    const existingExpense = await prisma.expense.findFirst({
      where: { id, user_id: req.user.id }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Data pengeluaran tidak ditemukan' });
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.json({ message: 'Data pengeluaran berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids, password } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang dipilih untuk dihapus' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Sandi akun diperlukan untuk menghapus pengeluaran' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi salah. Penghapusan dibatalkan demi keamanan.' });
    }

    const result = await prisma.expense.deleteMany({
      where: { 
        id: { in: ids },
        user_id: req.user.id
      }
    });

    res.json({ message: `${result.count} data pengeluaran berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Dashboard ---
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Get raw incomes and expenses for this user
    const incomes = await prisma.income.findMany({ where: { user_id: req.user.id } });
    const expenses = await prisma.expense.findMany({ where: { user_id: req.user.id }, include: { category: true } });

    // 2. Calculate Totals
    const totalRevenue = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // 2.5 Financial Targets Logic
    const targets = await prisma.financialTarget.findMany({ where: { user_id: req.user.id } });
    
    const activeTargets = [];
    
    for (const target of targets) {
      if (new Date() > target.end_date) {
        // Target expired, delete it
        await prisma.financialTarget.delete({ where: { id: target.id } });
      } else {
        let currentAmount = 0;
        
        if (target.type === 'expense') {
          const targetExpenses = expenses.filter(e => {
            const expDate = new Date(e.transaction_date);
            return expDate >= new Date(target.start_date) && expDate <= new Date(target.end_date);
          });
          currentAmount = targetExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
        } else if (target.type === 'income') {
          const targetIncomes = incomes.filter(i => {
            const incDate = new Date(i.transaction_date);
            return incDate >= new Date(target.start_date) && incDate <= new Date(target.end_date);
          });
          currentAmount = targetIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
        }
        
        activeTargets.push({
          id: target.id,
          name: target.name,
          type: target.type,
          amount: Number(target.amount),
          startDate: target.start_date,
          endDate: target.end_date,
          currentAmount
        });
      }
    }
    
    // Some mock data for stats we don't track yet
    const invoices = await prisma.invoice.findMany({ where: { user_id: req.user.id }, include: { items: true } });
    const purchases = await prisma.purchase.findMany({ where: { user_id: req.user.id }, include: { items: true } });
    let totalProductsSold = 0;
    invoices.forEach(inv => inv.items.forEach(item => totalProductsSold += item.qty));
    let totalProductsPurchased = 0;
    purchases.forEach(pur => pur.items.forEach(item => totalProductsPurchased += item.qty));

    // 3. Calculate Monthly Data for Chart (last 12 months mock + real data overriding it)
    // For simplicity, we just aggregate all available data by month
    const monthlyData = {};
    
    // Initialize last 6 months (mock skeleton)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${monthNames[past.getMonth()]} '${past.getFullYear().toString().substring(2)}`;
      monthlyData[key] = { name: key, revenue: 0, expenses: 0, margin: 0 };
    }

    incomes.forEach(inc => {
      const date = new Date(inc.transaction_date);
      const key = `${monthNames[date.getMonth()]} '${date.getFullYear().toString().substring(2)}`;
      if (!monthlyData[key]) monthlyData[key] = { name: key, revenue: 0, expenses: 0, margin: 0 };
      monthlyData[key].revenue += Number(inc.amount);
    });

    expenses.forEach(exp => {
      const date = new Date(exp.transaction_date);
      const key = `${monthNames[date.getMonth()]} '${date.getFullYear().toString().substring(2)}`;
      if (!monthlyData[key]) monthlyData[key] = { name: key, revenue: 0, expenses: 0, margin: 0 };
      monthlyData[key].expenses += Number(exp.amount);
    });

    // Calculate margin percentages
    Object.keys(monthlyData).forEach(key => {
      const rev = monthlyData[key].revenue;
      const exp = monthlyData[key].expenses;
      if (rev > 0) {
        monthlyData[key].margin = Math.round(((rev - exp) / rev) * 100);
      }
    });

    // 4. Expense by Category breakdown
    const categoryTotals = {};
    expenses.forEach(exp => {
      const catName = exp.category?.name || 'Other';
      if (!categoryTotals[catName]) categoryTotals[catName] = 0;
      categoryTotals[catName] += Number(exp.amount);
    });
    const expenseByCategory = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

    res.json({
      totals: {
        totalRevenue,
        totalExpenses,
        netProfit,
        grossProfit: totalRevenue, // simplified
        totalProductsSold,
        totalProductsPurchased
      },
      chartData: Object.values(monthlyData),
      expenseByCategory,
      activeTargets
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJournals = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      where: { user_id: req.user.id },
      include: { category: true }
    });
    const expenses = await prisma.expense.findMany({
      where: { user_id: req.user.id },
      include: { category: true }
    });

    const journals = [
      ...incomes.map(inc => ({
        id: inc.id,
        date: inc.transaction_date,
        account: inc.category?.name || 'Income',
        description: inc.note || 'Pemasukan',
        debit: inc.amount,
        credit: 0,
        type: 'Asset'
      })),
      ...expenses.map(exp => ({
        id: exp.id,
        date: exp.transaction_date,
        account: exp.category?.name || 'Expense',
        description: exp.note || 'Pengeluaran',
        debit: 0,
        credit: exp.amount,
        type: 'Expense'
      }))
    ];

    journals.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(journals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Customers & Suppliers ---
exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { user_id: req.user.id },
      orderBy: { name: 'asc' }
    });
    console.log(`[GET /customers] User: ${req.user.email} (${req.user.id}) -> Found ${customers.length} contacts`);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const customer = await prisma.customer.create({
      data: {
        user_id: req.user.id,
        name,
        phone,
        email,
        address,
        notes
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes } = req.body;
    
    const existing = await prisma.customer.findFirst({
      where: { id, user_id: req.user.id }
    });
    
    if (!existing) return res.status(404).json({ error: 'Kontak tidak ditemukan' });
    
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, email, address, notes }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.customer.findFirst({
      where: { id, user_id: req.user.id }
    });
    
    if (!existing) return res.status(404).json({ error: 'Kontak tidak ditemukan' });
    
    await prisma.customer.delete({
      where: { id }
    });
    res.json({ message: 'Kontak berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { user_id: req.user.id },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Financial Targets ---
exports.createTarget = async (req, res) => {
  try {
    const { name, type, amount, period } = req.body;
    let startDate = new Date();
    
    let endDate = new Date(startDate);
    
    if (period === '1 Hari') {
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '3 Hari') {
      endDate.setDate(endDate.getDate() + 2);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '1 Minggu') {
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '1 Bulan') {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ error: 'Periode tidak valid' });
    }

    const target = await prisma.financialTarget.create({
      data: {
        user_id: req.user.id,
        name,
        type,
        amount: parseFloat(amount),
        start_date: startDate,
        end_date: endDate
      }
    });

    res.json({ message: 'Target berhasil disimpan', target });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.financialTarget.delete({
      where: { id }
    });
    res.json({ message: 'Target berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

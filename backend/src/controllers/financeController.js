const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

// --- Categories ---
exports.getCategories = async (req, res) => {
  try {
    const now = new Date();
    await prisma.category.updateMany({
      where: {
        user_id: req.user.id,
        budget_end_date: {
          lt: now
        }
      },
      data: {
        budget_limit: null,
        budget_name: null,
        budget_start_date: null,
        budget_end_date: null
      }
    });

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

exports.updateCategoryBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budget_limit, budget_name, duration_days } = req.body;
    
    const category = await prisma.category.findFirst({
      where: { id, OR: [{ user_id: req.user.id }, { user_id: null }] }
    });

    if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    let budget_start_date = null;
    let budget_end_date = null;

    if (budget_limit) {
      budget_start_date = new Date();
      if (duration_days) {
        budget_end_date = new Date();
        budget_end_date.setDate(budget_end_date.getDate() + parseInt(duration_days));
      }
    }

    const dataToUpdate = {
      budget_limit: budget_limit ? parseFloat(budget_limit) : null,
      budget_name: budget_limit ? budget_name : null,
      budget_start_date: budget_limit ? budget_start_date : null,
      budget_end_date: budget_limit ? budget_end_date : null
    };

    let targetId = category.id;
    if (category.user_id === null) {
      const newCat = await prisma.category.create({
        data: { name: category.name, type: category.type, user_id: req.user.id, ...dataToUpdate }
      });
      targetId = newCat.id;
    } else {
      await prisma.category.update({
        where: { id: targetId },
        data: dataToUpdate
      });
    }

    res.json({ message: 'Anggaran berhasil diperbarui', categoryId: targetId });
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
        message: `Pemasukan baru ditambahkan: Rp ${income.amount.toLocaleString('id-ID')} (${income.category?.name || 'Lainnya'})`,
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
      where: { name: category_id, type: 'expense', OR: [{ user_id: req.user.id }, { user_id: null }] }
    });
    if (!actualCategory) {
      actualCategory = await prisma.category.create({
        data: { name: category_id, type: 'expense', user_id: req.user.id }
      });
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
        message: `Pengeluaran baru dicatat: Rp ${expense.amount.toLocaleString('id-ID')} (${expense.category?.name || 'Lainnya'})`,
        type: 'expense'
      }
    });

    // Check Budget Limit
    if (actualCategory.budget_limit) {
      const budgetLimit = parseFloat(actualCategory.budget_limit);
      const expenseDate = new Date(transaction_date);
      
      let startDate = actualCategory.budget_start_date ? new Date(actualCategory.budget_start_date) : new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
      let endDate = actualCategory.budget_end_date ? new Date(actualCategory.budget_end_date) : new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);

      // Only check if expense date is within budget range
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const periodExpenses = await prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            user_id: req.user.id,
            category_id: actualCategory.id,
            transaction_date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const totalSpent = parseFloat(periodExpenses._sum.amount || 0);
        const previousTotal = totalSpent - parseFloat(amount);
        const budgetNameStr = actualCategory.budget_name ? `"${actualCategory.budget_name}"` : actualCategory.name;

        if (totalSpent >= budgetLimit && previousTotal < budgetLimit) {
          await prisma.notification.create({
            data: {
              user_id: req.user.id,
              message: `Anggaran Terlampaui: Pengeluaran ${budgetNameStr} telah mencapai 100% dari batas (Rp ${budgetLimit.toLocaleString('id-ID')}).`,
              type: 'budget_alert'
            }
          });
        } else if (totalSpent >= budgetLimit * 0.8 && previousTotal < budgetLimit * 0.8) {
          await prisma.notification.create({
            data: {
              user_id: req.user.id,
              message: `Peringatan Anggaran: Pengeluaran ${budgetNameStr} telah mencapai 80% dari batas (Rp ${budgetLimit.toLocaleString('id-ID')}).`,
              type: 'budget_alert'
            }
          });
        }
      }
    }

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
      expenseByCategory
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

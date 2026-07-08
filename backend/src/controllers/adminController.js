const prisma = require('../prismaClient');

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    
    res.json({
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'Admin' } },
      select: {
        id: true,
        name: true,
        email: true,
        last_active: true,
        is_suspended: true,
        incomes: { select: { amount: true } },
        expenses: { select: { amount: true } }
      }
    });

    const formattedUsers = users.map(user => {
      const totalIncome = user.incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
      const totalExpense = user.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        last_active: user.last_active,
        is_suspended: user.is_suspended,
        totalIncome,
        totalExpense
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_suspended: !user.is_suspended }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({ select: { amount: true, transaction_date: true }});
    const expenses = await prisma.expense.findMany({ select: { amount: true, transaction_date: true }});
    
    const monthlyData = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('id-ID', { month: 'short' });
      const year = d.getFullYear();
      const key = `${month} ${year}`;
      const sortKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { name: key, Pemasukan: 0, Pengeluaran: 0, _sort: sortKey };
    }
    
    const processItem = (item, type) => {
      const date = new Date(item.transaction_date);
      const month = date.toLocaleString('id-ID', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (monthlyData[key]) {
        monthlyData[key][type] += Number(item.amount);
      }
    };

    incomes.forEach(i => processItem(i, 'Pemasukan'));
    expenses.forEach(e => processItem(e, 'Pengeluaran'));
    
    const result = Object.values(monthlyData).sort((a, b) => a._sort.localeCompare(b._sort));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

exports.getPopularCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: { name: true, _count: { select: { incomes: true, expenses: true } } }
    });
    
    const grouped = {};
    categories.forEach(c => {
      if (!grouped[c.name]) grouped[c.name] = 0;
      grouped[c.name] += c._count.incomes + c._count.expenses;
    });

    const popular = Object.keys(grouped).map(name => ({
      name,
      value: grouped[name]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    res.json(popular);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};

exports.replyToReport = async (req, res) => {
  try {
    const { replyText } = req.body;
    const reportId = req.params.id;

    if (!replyText) {
      return res.status(400).json({ message: 'Teks balasan harus diisi' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true }
    });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        admin_reply: replyText,
        status: 'Dijawab'
      }
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        user_id: report.user_id,
        message: `Admin membalas laporan Anda ("${report.subject}"): ${replyText}`,
        type: 'report_reply'
      }
    });

    res.json({ message: 'Balasan berhasil dikirim', report: updatedReport });
  } catch (error) {
    console.error('Error replying to report:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    await prisma.report.delete({ where: { id: reportId } });
    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

const prisma = require('../prismaClient');

exports.createReport = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let newTokens = user.report_tokens;
    let newExhaustions = user.report_exhaustions;
    let newRefreshTime = user.token_refresh_time;
    const now = new Date();

    if (user.report_tokens === 0) {
      if (user.token_refresh_time && now < new Date(user.token_refresh_time)) {
        return res.status(403).json({ 
          message: 'Kuota laporan Anda habis. Harap tunggu hingga ' + new Date(user.token_refresh_time).toLocaleString('id-ID')
        });
      }
      
      // Token refreshed, but immediately consumed for this report
      newTokens = 0; 
      newExhaustions += 1;
      
      if (newExhaustions > 3) {
        await prisma.user.delete({ where: { id: userId } });
        return res.status(403).json({ message: 'Akun Anda telah terhapus otomatis dari database karena terlalu banyak melakukan spam laporan melebihi batas yang diizinkan.' });
      }
      
      const twoDaysLater = new Date();
      twoDaysLater.setDate(twoDaysLater.getDate() + 2);
      newRefreshTime = twoDaysLater;
      
    } else {
      newTokens -= 1;
      if (newTokens === 0) {
        newExhaustions += 1;
        const twoDaysLater = new Date();
        twoDaysLater.setDate(twoDaysLater.getDate() + 2);
        newRefreshTime = twoDaysLater;
      }
    }

    // Update user quota
    await prisma.user.update({
      where: { id: userId },
      data: {
        report_tokens: newTokens,
        report_exhaustions: newExhaustions,
        token_refresh_time: newRefreshTime
      }
    });

    const report = await prisma.report.create({
      data: {
        user_id: userId,
        subject,
        message,
        status: 'Pending'
      }
    });

    // Create a notification for admins
    const admins = await prisma.user.findMany({
      where: { role: 'Admin' }
    });

    const notifications = admins.map(admin => ({
      user_id: admin.id,
      message: `Laporan baru dari ${req.user.email}: ${subject}`,
      type: 'report'
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    res.status(201).json({ message: 'Laporan berhasil dikirim ke Admin', report, newTokens });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

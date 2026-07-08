const prisma = require('../prismaClient');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { user_id: req.user.id }
    });
    res.json({ message: 'Semua notifikasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

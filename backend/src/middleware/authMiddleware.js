const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.is_suspended) {
      const isAllowed = req.originalUrl.includes('/api/auth/me') || (req.method === 'POST' && req.originalUrl.includes('/api/reports'));
      if (!isAllowed) {
        return res.status(403).json({ message: 'Akun Anda telah ditangguhkan', is_suspended: true });
      }
    }

    // Update last_active asynchronously (don't await to avoid blocking)
    prisma.user.update({
      where: { id: user.id },
      data: { last_active: new Date() }
    }).catch(err => console.error('Failed to update last_active:', err));

    req.user = decoded; // Contains id, email, role
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;

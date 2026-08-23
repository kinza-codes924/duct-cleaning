const jwt = require('jsonwebtoken');

// Without JWT_SECRET the fallback below is public (it is in this file), which
// would let anyone mint a valid admin token, so warn loudly when it is missing.
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set — admin tokens are signed with a public fallback key.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'pacific-duct-admin-secret-key';

function requireAdmin(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { requireAdmin, JWT_SECRET };

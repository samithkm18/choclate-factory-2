import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Use lazy getter so JWT_SECRET is read after dotenv.config() runs
const getJwtSecret = () => process.env.JWT_SECRET || 'manis_luxury_chocolate_secret_key_2026_rfv_tgb';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    // Verify user still exists in database and is active
    const user = await User.findById(decoded.id).select('id _id name email role status');
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Contact support.' });
    }

    // Attach user to req (mapping _id to id for compatibility)
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role authorization middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${allowedRoles.join(' or ')}` });
    }

    next();
  };
};

// Simple login rate limiter mockup (stateful in-memory)
const loginAttempts = new Map();
export const loginRateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 mins
  const maxAttempts = 10;

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }

  const attempts = loginAttempts.get(ip).filter(timestamp => now - timestamp < limitWindow);
  attempts.push(now);
  loginAttempts.set(ip, attempts);

  if (attempts.length > maxAttempts) {
    return res.status(429).json({
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }

  next();
};

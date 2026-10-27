import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate a JWT token for the user ID
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Set HTTP-only cookie with the token and return safe user response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token, // Also return token for clients using Authorization header
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate presence of required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Allow admin creation if correct admin secret key is supplied
    const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
    const isAdmin = Boolean(
      (req.body.adminSecret && req.body.adminSecret === expectedSecret) ||
      (req.body.role === 'admin' && req.body.adminSecret === expectedSecret)
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: isAdmin ? 'admin' : 'user',
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (protect middleware)
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upgrade current user to admin using secret key
 * @route   POST /api/auth/upgrade-admin
 * @access  Private
 */
export const upgradeToAdmin = async (req, res, next) => {
  try {
    const { secretKey } = req.body;
    const expected = process.env.ADMIN_SECRET || 'admin123';

    if (!secretKey || secretKey !== expected) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin secret key (default is: admin123)',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully upgraded account to Administrator',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Automatically ensures default admin account exists upon server startup
 */
export const ensureAdminUser = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@imovies.in').toLowerCase();
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: defaultPassword,
        role: 'admin',
      });
      console.log(`👑 Default admin user created: ${adminEmail} (password: ${defaultPassword})`);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`👑 Existing account upgraded to admin: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('Admin user auto-seed notice:', err.message);
  }
};

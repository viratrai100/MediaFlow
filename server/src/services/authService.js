import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { env } from '../config/env.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export class AuthService {
  /**
   * Register a new user with strict input validation
   */
  static async signup({ username, email, password, role = 'user', reqMeta = {} }) {
    if (!username || !email || !password) {
      throw new AppError(
        'Username, email, and password are required.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Validate username format
    if (!USERNAME_REGEX.test(cleanUsername)) {
      throw new AppError(
        'Username must be 3-30 characters long and can contain letters, numbers, hyphens, and underscores.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 2. Validate email format
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new AppError(
        'Please provide a valid email address.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Validate password strength: min 8 chars, at least 1 letter, 1 number
    if (password.length < 8) {
      throw new AppError(
        'Password must be at least 8 characters long.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      throw new AppError(
        'Password must contain at least one letter and one number.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Check existing email or username
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      throw new AppError(
        'An account with this email already exists.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      throw new AppError(
        'Username is already taken. Please choose another.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 5. Hash password
    const passwordHash = await User.hashPassword(password);

    // 6. Create User document (Public signup always defaults to 'user' unless created by an admin flow)
    const userRole = role === 'admin' && reqMeta.isAdminCreator ? 'admin' : 'user';

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: userRole
    });

    // 7. Generate token and session
    const { token, expiresAt } = this.generateToken(user._id, user.role);

    const session = await Session.create({
      user: user._id,
      token,
      ipAddress: reqMeta.ip || 'unknown',
      userAgent: reqMeta.userAgent || 'unknown',
      expiresAt
    });

    // 8. Audit log
    await AuditLog.create({
      user: user._id,
      action: 'USER_SIGNUP',
      resource: 'auth',
      ipAddress: reqMeta.ip || 'unknown',
      userAgent: reqMeta.userAgent || 'unknown',
      status: 'success'
    });

    return {
      user: user.toSafeObject(),
      token,
      expiresAt
    };
  }

  /**
   * Authenticate user & issue session
   */
  static async login({ email, password, reqMeta = {} }) {
    if (!email || !password) {
      throw new AppError(
        'Email and password are required.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 1. Find user by email with passwordHash explicitly selected
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      throw new AppError(
        'Invalid email or password.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 2. Check if user is blocked
    if (user.isBlocked) {
      throw new AppError(
        'This account has been suspended. Please contact support.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
      );
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Audit failed attempt
      await AuditLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ipAddress: reqMeta.ip || 'unknown',
        userAgent: reqMeta.userAgent || 'unknown',
        status: 'failure',
        details: { reason: 'Incorrect password' }
      });

      throw new AppError(
        'Invalid email or password.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // 5. Generate token & session
    const { token, expiresAt } = this.generateToken(user._id, user.role);

    const session = await Session.create({
      user: user._id,
      token,
      ipAddress: reqMeta.ip || 'unknown',
      userAgent: reqMeta.userAgent || 'unknown',
      expiresAt
    });

    // 6. Audit success
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      resource: 'auth',
      ipAddress: reqMeta.ip || 'unknown',
      userAgent: reqMeta.userAgent || 'unknown',
      status: 'success'
    });

    return {
      user: user.toSafeObject(),
      token,
      expiresAt
    };
  }

  /**
   * Logout user by invalidating/revoking session
   */
  static async logout(token, userId = null) {
    if (token) {
      await Session.updateMany({ token }, { $set: { isValid: false } });
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'USER_LOGOUT',
        resource: 'auth',
        status: 'success'
      });
    }

    return true;
  }

  /**
   * Generate JWT Token helper
   */
  static generateToken(userId, role) {
    const payload = {
      sub: userId.toString(),
      role
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    // Calculate expiry date (default 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return { token, expiresAt };
  }
}

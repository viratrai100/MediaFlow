import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { env } from '../config/env.js';

/**
 * Middleware: Verify Bearer JWT Token & Database Session
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError(
          'Authentication required. Please provide a valid Bearer token.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // 1. Verify JWT signature & expiration
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return next(
        new AppError(
          'Invalid or expired token. Please log in again.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // 2. Check Session validity in MongoDB (revocation check)
    const session = await Session.findOne({ token, isValid: true });
    if (!session || session.expiresAt < new Date()) {
      return next(
        new AppError(
          'Session has expired or been revoked. Please log in again.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // 3. Find User
    const user = await User.findById(decoded.sub);
    if (!user || user.isBlocked) {
      return next(
        new AppError(
          'User not found or account is deactivated.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Require specific user roles (e.g. 'admin')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          'Authentication required.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Forbidden: You do not have permission to access this resource.',
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
        )
      );
    }

    next();
  };
}

/**
 * Middleware: Optional authentication (attaches user if token present, does not reject guests)
 */
export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const session = await Session.findOne({ token, isValid: true });

    if (session && session.expiresAt > new Date()) {
      const user = await User.findById(decoded.sub);
      if (user && !user.isBlocked) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (err) {
    req.user = null;
  }

  next();
}

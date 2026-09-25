import { AuthService } from '../services/authService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class AuthController {
  /**
   * POST /api/v1/auth/signup
   */
  static async signup(req, res, next) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        throw new AppError(
          'Username, email, and password are required.',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const result = await AuthService.signup({ username, email, password, role, reqMeta });

      return ApiResponse.created(
        res,
        result,
        'User account registered successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const result = await AuthService.login({ email, password, reqMeta });

      return ApiResponse.success(
        res,
        result,
        'Logged in successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const token = req.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
      const userId = req.user ? req.user._id : null;

      await AuthService.logout(token, userId);

      return ApiResponse.success(
        res,
        { loggedOut: true },
        'Session revoked and logged out successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError(
          'Not authenticated.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      return ApiResponse.success(
        res,
        {
          user: req.user.toSafeObject(),
          session: {
            id: req.session._id,
            expiresAt: req.session.expiresAt,
            ipAddress: req.session.ipAddress
          }
        },
        'Current user profile retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

import { HTTP_STATUS } from '../constants/httpStatusCodes.js';

/**
 * Standardized JSON API Response Helper
 */
export class ApiResponse {
  /**
   * Send Success Response
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = null) {
    const payload = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send Created Response
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send Error Response
   */
  static error(res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = 'ERROR', details = null) {
    const payload = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details })
      },
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(payload);
  }
}

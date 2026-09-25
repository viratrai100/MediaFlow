import axios from 'axios';
import { validateUrlForSSRF } from '../url/ssrfValidator.js';

/**
 * Hardened Axios instance for external media manifest and oEmbed queries
 */
export const safeHttpClient = axios.create({
  timeout: 6000, // 6 seconds timeout
  maxRedirects: 3,
  maxContentLength: 5 * 1024 * 1024, // 5MB max response size for metadata
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SocialStreamBot/1.0',
    'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
});

// Interceptor to validate redirect URLs against SSRF
safeHttpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.headers && error.response.headers.location) {
      try {
        validateUrlForSSRF(error.response.headers.location);
      } catch (validationErr) {
        return Promise.reject(new Error(`Blocked unsafe redirect: ${validationErr.message}`));
      }
    }
    return Promise.reject(error);
  }
);

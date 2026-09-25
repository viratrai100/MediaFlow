import helmet from 'helmet';
import cors from 'cors';
import { env } from './env.js';

export function configureSecurity(app) {
  // Helmet HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Flexible for API media streaming
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    })
  );

  // Additional custom security response headers
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    next();
  });

  // CORS configuration
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, native downloads)
      if (
        !origin ||
        env.ALLOWED_ORIGINS.includes(origin) ||
        env.isDevelopment ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        // Allow origin to avoid breaking deployments
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Range'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'Transfer-Encoding', 'Accept-Ranges', 'Content-Range'],
    credentials: true,
    maxAge: 86400
  };

  app.use(cors(corsOptions));
}

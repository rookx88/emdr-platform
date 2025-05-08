// Enhanced Security Headers Middleware
import { Request, Response, NextFunction } from 'express';

export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set strict Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " + 
    "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for UI frameworks
    "img-src 'self' data:; " + 
    "font-src 'self'; " + 
    "connect-src 'self'; " + 
    "media-src 'self'; " + 
    "object-src 'none'; " + 
    "frame-ancestors 'none'; " + 
    "form-action 'self'; " + 
    "base-uri 'self';"
  );
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable the XSS filter in the browser
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Restrict referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Disable browser features
  res.setHeader('Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), serial=()'
  );
  
  // Add HIPAA compliance header
  res.setHeader('X-HIPAA-Compliance', 'PHI-Protected');
  
  next();
};

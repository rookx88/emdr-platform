// Enhanced authController.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userService } from '../services/userService';
import { prisma } from '../lib/prisma';

// Maximum failed login attempts before account lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in minutes
const LOCKOUT_DURATION = 30;

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      // Check if user already exists
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
      
      // Create new user
      const user = await userService.createUser(
        email, 
        password, 
        role, 
        firstName, 
        lastName,
        req.user?.userId // Current user as actor for audit
      );
      
      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;
      
      // Log successful registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'Unknown',
          timestamp: new Date()
        }
      });
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  },
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      // Record login attempt
      const loginAttempt = await prisma.loginAttempt.create({
        data: {
          email,
          ipAddress: req.ip,
          successful: false, // Default to false, update if successful
          timestamp: new Date()
        }
      });
      
      // Find user
      const user = await userService.findUserByEmail(email);
      
      // If user doesn't exist, return generic error
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if account is locked
      if (user.lockedAt && user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTimeElapsed = (new Date().getTime() - user.lockedAt.getTime()) / 60000; // Convert to minutes
        
        if (lockoutTimeElapsed < LOCKOUT_DURATION) {
          const remainingMinutes = Math.ceil(LOCKOUT_DURATION - lockoutTimeElapsed);
          return res.status(403).json({ 
            message: `Account is temporarily locked. Please try again in ${remainingMinutes} minutes.` 
          });
        } else {
          // Reset lockout if duration has passed
          await userService.updateUser(user.id, { 
            lockedAt: null, 
            lockedReason: null,
            failedLoginAttempts: 0
          });
        }
      }
      
      // Check if account is inactive for other reasons
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        // Increment failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = { 
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: new Date()
        };
        
        // Lock account if max attempts reached
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          updateData.lockedAt = new Date();
          updateData.lockedReason = 'Too many failed login attempts';
        }
        
        await userService.updateUser(user.id, updateData);
        
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Update last login and reset failed attempts
      await userService.updateUser(user.id, { 
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lastFailedLogin: null
      });
      
      // Update login attempt to successful
      await prisma.loginAttempt.update({
        where: { id: loginAttempt.id },
        data: { successful: true }
      });
      
      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      // Define payload and options
      const payload = { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        // Add session ID for invalidation capability
        sessionId: crypto.randomUUID()
      };
      
      const jwtExpiry = process.env.JWT_EXPIRY || '24h';
      
      // Generate JWT
      const token = jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: jwtExpiry }
      );
      
      // Log successful login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'Unknown',
          timestamp: new Date()
        }
      });
      
      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;
      
      // Set auth cookie for enhanced security
      res.cookie('auth_token', token, {
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 1000 * 60 * 60 * 24 // 24 hours in milliseconds
      });
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  },
  
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear auth cookie
      res.clearCookie('auth_token');
      
      // Log logout if user is authenticated
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'LOGOUT',
            resourceType: 'User',
            resourceId: req.user.userId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || 'Unknown',
            timestamp: new Date()
          }
        });
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
};
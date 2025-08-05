import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userService } from '../services/userService';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30;

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
      const user = await userService.createUser(
        email,
        password,
        role,
        firstName,
        lastName,
        req.user?.userId
      );
      const { passwordHash, ...userWithoutPassword } = user;
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress: req.ip || '0.0.0.0',
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
      
      // record login attempt
      const loginAttempt = await prisma.loginAttempt.create({
        data: {
          email,
          ipAddress: req.ip || '0.0.0.0',
          successful: false,
          timestamp: new Date()
        }
      });
      const user = await userService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // enforce lockout rules
      if (user.lockedAt && user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTimeElapsed = (new Date().getTime() - user.lockedAt.getTime()) / 60000;
        if (lockoutTimeElapsed < LOCKOUT_DURATION) {
          const remainingMinutes = Math.ceil(LOCKOUT_DURATION - lockoutTimeElapsed);
          return res.status(403).json({
            message: `Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`
          });
        } else {
          await userService.updateUser(user.id, {
            lockedAt: null,
            lockedReason: null,
            failedLoginAttempts: 0
          });
        }
      }
      // ensure account is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
      }
      // verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = {
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: new Date()
        };
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          updateData.lockedAt = new Date();
          updateData.lockedReason = 'Too many failed login attempts';
        }
        await userService.updateUser(user.id, updateData);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // update login info
      await userService.updateUser(user.id, {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lastFailedLogin: null
      });
      await prisma.loginAttempt.update({
        where: { id: loginAttempt.id },
        data: { successful: true }
      });
      // generate token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: crypto.randomUUID() // for invalidation
      };
      const jwtExpiry = process.env.JWT_EXPIRY || '24h';
      const options: SignOptions = {
        expiresIn: jwtExpiry as jwt.SignOptions['expiresIn']
      };
      const token = jwt.sign(
        payload,
        Buffer.from(jwtSecret, 'utf-8'),
        options
      );
      // log login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress: req.ip || '0.0.0.0',
          userAgent: req.headers['user-agent'] || 'Unknown',
          timestamp: new Date()
        }
      });
      
      const { passwordHash, ...userWithoutPassword } = user;
      // set auth cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
      });
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  },
  
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('auth_token');
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'LOGOUT',
            resourceType: 'User',
            resourceId: req.user.userId,
            ipAddress: req.ip || '0.0.0.0',
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

import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userService } from '../services/userService';

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
      const user = await userService.createUser(email, password, role, firstName, lastName);
      
      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  },
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await userService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Update last login
      await userService.updateUser(user.id, { lastLoginAt: new Date() });
      
      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      // Define payload and options separately with proper types
      const payload = { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      // Use a properly typed options object
      const jwtExpiry = process.env.JWT_EXPIRY || '24h';
      const options: SignOptions = { 
        expiresIn: jwtExpiry as any
      };
      
      // Generate JWT
      const token = jwt.sign(
        payload,
        jwtSecret,
        options
      );
      
      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  }
};
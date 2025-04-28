import express from 'express';
import { userService } from '../services/userService';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Get current user - protected route
router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await userService.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

export default router;
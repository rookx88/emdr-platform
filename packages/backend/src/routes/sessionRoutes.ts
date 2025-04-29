// packages/backend/src/routes/sessionRoutes.ts
import express from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { twilioService } from '../services/twilioService';
import { speechService } from '../services/speechService';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';

const router = express.Router();

/**
 * Route to get a Twilio access token for a specific session
 */
router.post('/token', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Generate a unique room name using the session ID
    const roomName = `session-${sessionId}`;
    
    // Get Twilio token
    const token = await twilioService.generateToken(req.user!.userId, roomName);
    
    res.json({ token, roomName });
  } catch (error) {
    next(error);
  }
});

/**
 * Route to create or get a Twilio room
 */
router.post('/room', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Generate a unique room name using the session ID
    const roomName = `session-${sessionId}`;
    
    // Create or get room
    const room = await twilioService.createOrGetRoom(roomName);
    
    // Log room creation/access
    await createAuditLog(
      req.user!.userId,
      'ROOM_ACCESS',
      'Session',
      sessionId,
      { roomSid: room.sid, status: room.status }
    );
    
    res.json({ room });
  } catch (error) {
    next(error);
  }
});

/**
 * Route to end a Twilio room session
 */
router.post('/room/end', authenticate, async (req, res, next) => {
  try {
    const { roomSid, sessionId } = req.body;
    
    if (!roomSid || !sessionId) {
      return res.status(400).json({ message: 'Room SID and Session ID are required' });
    }
    
    // End the room
    const room = await twilioService.endRoom(roomSid);
    
    // Log room ending
    await createAuditLog(
      req.user!.userId,
      'END_ROOM',
      'Session',
      sessionId,
      { roomSid, status: room.status }
    );
    
    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
});

/**
 * Route to handle speech-to-text transcription
 */
router.post('/transcribe', authenticate, async (req, res, next) => {
  try {
    const { audioContent, sessionId } = req.body;
    
    if (!audioContent || !sessionId) {
      return res.status(400).json({ message: 'Audio content and Session ID are required' });
    }
    
    // Perform transcription
    const transcription = await speechService.transcribe(
      audioContent,
      req.user!.userId,
      sessionId
    );
    
    // Save transcription to database if it contains content
    if (transcription && transcription.trim().length > 0) {
      await speechService.saveTranscription(
        sessionId,
        req.user!.userId,
        transcription
      );
    }
    
    res.json({ transcription });
  } catch (error) {
    next(error);
  }
});

/**
 * Route to save session notes
 */
router.post('/notes', authenticate, async (req, res, next) => {
  try {
    const { content, sessionId } = req.body;
    
    if (!content || !sessionId) {
      return res.status(400).json({ message: 'Content and Session ID are required' });
    }
    
    // Create note
    const note = await prisma.note.create({
      data: {
        authorId: req.user!.userId,
        content,
        isEncrypted: true, // Ensure sensitive data is encrypted
      }
    });
    
    // Log note creation
    await createAuditLog(
      req.user!.userId,
      'CREATE_SESSION_NOTE',
      'Note',
      note.id,
      { sessionId }
    );
    
    res.json({ note });
  } catch (error) {
    next(error);
  }
});

/**
 * Route to get session notes
 */
router.get('/notes/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Get notes
    const notes = await prisma.note.findMany({
      where: {
        authorId: req.user!.userId,
        // In a real implementation, you would have a sessionId field
        // in the notes table to link notes to sessions
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Log notes access
    await createAuditLog(
      req.user!.userId,
      'GET_SESSION_NOTES',
      'Session',
      sessionId,
      { count: notes.length }
    );
    
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

export default router;
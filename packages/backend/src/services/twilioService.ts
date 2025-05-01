// packages/backend/src/services/twilioService.ts
import twilio from 'twilio';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Keep track of room creation attempts to prevent duplicates
const roomCreationAttempts = new Map<string, boolean>();

export const twilioService = {
  /**
   * Generate an access token for Twilio Video
   * @param identity User identity (userId)
   * @param roomName Name of the room to connect to
   * @returns Access token
   */
  generateToken: async (identity: string, roomName: string) => {
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Create an access token
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity }
    );

    // Create a video grant for this specific room
    const videoGrant = new VideoGrant({ room: roomName });

    // Add the grant to the token
    token.addGrant(videoGrant);

    // Log token generation for audit purposes
    await createAuditLog(
      identity,
      'GENERATE_TWILIO_TOKEN',
      'Session',
      roomName,
      { action: 'generate_token' }
    );

    return token.toJwt();
  },

  /**
   * Create a new Twilio room or get an existing one
   * @param roomName Name of the room
   * @returns Room SID
   */
  createOrGetRoom: async (roomName: string) => {
    // Check if we're already attempting to create this room
    if (roomCreationAttempts.get(roomName)) {
      console.log(`Room creation for ${roomName} already in progress, waiting...`);
      
      // Wait for a short time and check if room exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const existingRooms = await twilioClient.video.v1.rooms.list({
        uniqueName: roomName,
        status: 'in-progress'
      });
      
      if (existingRooms.length > 0) {
        console.log(`Found existing room ${roomName} after waiting`);
        return existingRooms[0];
      }
    }
    
    // Mark that we're attempting to create this room
    roomCreationAttempts.set(roomName, true);
    
    try {
      // First check if the room already exists
      const rooms = await twilioClient.video.v1.rooms.list({
        uniqueName: roomName,
        status: 'in-progress'
      });

      // If room exists, return it
      if (rooms.length > 0) {
        console.log(`Room ${roomName} already exists, returning existing room`);
        return rooms[0];
      }

      // If room doesn't exist, create it
      try {
        console.log(`Creating new room ${roomName}`);
        const room = await twilioClient.video.v1.rooms.create({
          uniqueName: roomName,
          type: 'group', // Use 'group' for multiparty rooms
          recordParticipantsOnConnect: false, // Set to true if you want to record
          statusCallback: process.env.TWILIO_STATUS_CALLBACK,
          statusCallbackMethod: 'POST'
        });
        
        return room;
      } catch (error: any) {
        // If error is "Room exists", try to fetch it again (race condition)
        if (error.code === 53113) {
          console.log('Room exists error, fetching room instead');
          const existingRooms = await twilioClient.video.v1.rooms.list({
            uniqueName: roomName,
            status: 'in-progress'
          });
          
          if (existingRooms.length > 0) {
            return existingRooms[0];
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating or getting room:', error);
      throw error;
    } finally {
      // Clear the attempt flag
      roomCreationAttempts.delete(roomName);
    }
  },

  /**
   * End a Twilio room session
   * @param roomSid Room SID to end
   * @returns Completed room
   */
  endRoom: async (roomSid: string) => {
    try {
      // Check if room exists first
      try {
        const room = await twilioClient.video.v1.rooms(roomSid).fetch();
        
        // Only try to end if it exists and is in progress
        if (room && room.status === 'in-progress') {
          console.log(`Ending room ${roomSid}`);
          return await twilioClient.video.v1.rooms(roomSid).update({
            status: 'completed'
          });
        } else {
          console.log(`Room ${roomSid} is not in progress (status: ${room.status}), skipping end operation`);
          return room;
        }
      } catch (fetchError: any) {
        // Room doesn't exist, no need to end it
        if (fetchError.status === 404) {
          console.log(`Room ${roomSid} not found, skipping end operation`);
          return null;
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error ending room:', error);
      throw error;
    }
  }
};
// packages/backend/src/services/twilioService.ts
import twilio from 'twilio';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
    try {
      // Check if the room already exists
      const rooms = await twilioClient.video.v1.rooms.list({
        uniqueName: roomName,
        status: 'in-progress'
      });

      // If room exists, return it
      if (rooms.length > 0) {
        return rooms[0];
      }

      // If room doesn't exist, create it
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group', // Use 'group' for multiparty rooms
        recordParticipantsOnConnect: false, // Set to true if you want to record
        statusCallback: process.env.TWILIO_STATUS_CALLBACK,
        statusCallbackMethod: 'POST'
      });

      return room;
    } catch (error) {
      console.error('Error creating or getting room:', error);
      throw error;
    }
  },

  /**
   * End a Twilio room session
   * @param roomSid Room SID to end
   * @returns Completed room
   */
  endRoom: async (roomSid: string) => {
    try {
      const room = await twilioClient.video.v1.rooms(roomSid).update({
        status: 'completed'
      });
      return room;
    } catch (error) {
      console.error('Error ending room:', error);
      throw error;
    }
  }
};
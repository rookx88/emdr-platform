// packages/backend/src/services/speechService.ts
import speech from '@google-cloud/speech';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../utils/auditLog';

// Create a client
const speechClient = new speech.SpeechClient();

export const speechService = {
  /**
   * Perform synchronous speech recognition on audio data
   * @param audioContent Base64-encoded audio data
   * @param userId User ID for audit logging
   * @returns Transcription results
   */
  transcribe: async (audioContent: string, userId: string, sessionId: string) => {
    try {
      // The audio content must be base64-encoded
      const audio = {
        content: audioContent
      };

      const config = {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'default'
      };

      const request = {
        audio: audio,
        config: config,
      };

      // Detects speech in the audio file
      const [response] = await speechClient.recognize(request);
      
      // Process the results
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join('\n');

      // Log transcription for audit purposes (without the actual content for privacy)
      await createAuditLog(
        userId,
        'SPEECH_TRANSCRIPTION',
        'Session',
        sessionId,
        { action: 'transcribe', length: transcription?.length || 0 }
      );

      // Return the transcription results
      return transcription || '';
    } catch (error) {
      console.error('Error in speech transcription:', error);
      throw error;
    }
  },

  /**
   * Save transcription to the database
   * @param sessionId Session ID
   * @param userId User ID
   * @param transcription Transcription text
   * @returns Saved transcription record
   */
  saveTranscription: async (sessionId: string, userId: string, transcription: string) => {
    try {
      // Create a note with the transcription
      const note = await prisma.note.create({
        data: {
          authorId: userId,
          content: transcription,
          isEncrypted: true, // Ensure sensitive data is encrypted
        }
      });

      // Log note creation
      await createAuditLog(
        userId,
        'CREATE_TRANSCRIPTION_NOTE',
        'Note',
        note.id,
        { sessionId, noteType: 'transcription' }
      );

      return note;
    } catch (error) {
      console.error('Error saving transcription:', error);
      throw error;
    }
  }
};
import 'twilio-video';

declare module 'twilio-video' {
  interface LocalTrack {
    stop(): void;
    mediaStreamTrack: MediaStreamTrack;
  }
} 
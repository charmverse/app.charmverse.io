import type { Mux } from '@mux/mux-node';

import { playbackRestrictionId } from './config';
import { mux } from './muxClient';

type MuxJWTSignOptions = NonNullable<Parameters<Mux.Jwt['signPlaybackId']>[1]>;

const signingKeyId = process.env.MUX_SIGNING_KEY_ID as string | undefined;
const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET as string | undefined;

const baseOptions: MuxJWTSignOptions = {
  keyId: signingKeyId, // Enter your signing key id here
  keySecret: signingKeySecret, // Enter your base64 encoded private key here
  expiration: '7d' // E.g 60, "2 days", "10h", "7d", numeric value interpreted as seconds
};

if (playbackRestrictionId) {
  baseOptions.params = {
    playback_restriction_id: playbackRestrictionId
  };
}

export async function getSignedToken(playbackId: string) {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  if (!baseOptions.keyId || !baseOptions.keySecret) {
    throw new Error('Mux signing keys not configured');
  }

  return mux.jwt.signPlaybackId(playbackId, { ...baseOptions, type: 'video' });
}

import Mux from '@mux/mux-node';

import { mux } from './muxClient';

const signingKeyId = process.env.MUX_SIGNING_KEY_ID as string | undefined;
const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET as string | undefined;

const baseOptions = {
  keyId: signingKeyId, // Enter your signing key id here
  keySecret: signingKeySecret, // Enter your base64 encoded private key here
  expiration: '7d' // E.g 60, "2 days", "10h", "7d", numeric value interpreted as seconds
};

export async function getSignedToken(playbackId: string) {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  if (!baseOptions.keyId || !baseOptions.keySecret) {
    throw new Error('Mux signing keys not configured');
  }

  return Mux.JWT.signPlaybackId(playbackId, { ...baseOptions, type: 'video' });
}

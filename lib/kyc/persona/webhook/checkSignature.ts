import crypto from 'crypto';

import type { PersonaEventData } from '../interfaces';

export function checkSignature({
  body,
  headers,
  secret
}: {
  headers: { 'Persona-Signature'?: string };
  secret: string;
  body: PersonaEventData;
}) {
  // Basic signature verification on a newly created webhook
  const signatureParams: Record<string, string> = {};
  headers['Persona-Signature']?.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    signatureParams[key] = value;
  });

  if (signatureParams.t && signatureParams.v1) {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${signatureParams.t}.${JSON.stringify(body)}`)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signatureParams.v1))) {
      return true;
    }
  }
  return false;
}

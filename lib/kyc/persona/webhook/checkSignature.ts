import crypto from 'crypto';

export function checkSignature({ body, signature, secret }: { signature?: string; secret: string; body: string }) {
  // Basic signature verification on a newly created webhook
  const t = signature?.split(',')?.[0]?.split('=')?.[1];
  const signatures = signature?.split(' ')?.map((pair) => pair.split('v1=')?.[1]);

  const hmac = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  const isVerified = signatures?.some((sig) => {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
  });

  if (isVerified) {
    return true;
  }

  return false;
}

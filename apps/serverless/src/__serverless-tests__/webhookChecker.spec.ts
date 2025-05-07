import { signJwt } from 'lib/webhookPublisher/authentication';

describe('SERVERLESS integration', () => {
  it('should call an offline version of the service', async () => {
    const webhookData = { charm: 'verse' };
    const tokenSecret = 'Checker: your_token_secret';
    const secret = Buffer.from(tokenSecret, 'hex');
    const signedJWT = await signJwt('webhook', webhookData, secret);
    const response = await fetch('http://localhost:3020/webhook', {
      method: 'POST',
      body: JSON.stringify(webhookData),
      headers: {
        Signature: signedJWT
      }
    });
    expect(response.status).toBe(200);
  });
});

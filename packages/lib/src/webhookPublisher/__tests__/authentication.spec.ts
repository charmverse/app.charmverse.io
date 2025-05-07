import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { createSigningSecret } from '@packages/lib/webhookPublisher/subscribeToEvents';
import { jwtVerify } from 'jose';

import type { SignedPayloadFields } from '../authentication';
import { signJwt } from '../authentication';

describe('Webhook publisher: authentication', () => {
  it('should sign and verify a message', async () => {
    const signingSecret = createSigningSecret();
    const data = mockPayload();

    const secret = Buffer.from(signingSecret, 'hex');
    const signature = await signJwt('webhook', data, secret);

    expect(signature).toBeTruthy();

    await expect(jwtVerify(signature, secret)).resolves.toBeTruthy();
  });
});

function mockPayload() {
  const event: Record<SignedPayloadFields, any> = {
    createdAt: new Date().toISOString(),
    spaceId: 'test_space',
    event: {
      scope: WebhookEventNames.HelloWorld,
      space: {
        id: 'id',
        name: 'name',
        url: 'url'
      }
    }
  };
  return event;
}

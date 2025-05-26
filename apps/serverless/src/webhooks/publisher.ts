import { log } from '@charmverse/core/log';

import { signJwt } from 'lib/webhookPublisher/authentication';
import type { WebhookPayload } from 'lib/webhookPublisher/interfaces';
import { whiteListedWebhookEvents } from 'lib/webhookPublisher/interfaces';

export async function publishToWebhook({ webhookURL, signingSecret, ...webhookData }: WebhookPayload) {
  const isWhitelistedEvent = whiteListedWebhookEvents.includes(webhookData.event.scope);

  if (!isWhitelistedEvent) {
    log.debug('Event is not whitelisted for publishing to webhooks', {
      scope: webhookData.event.scope,
      spaceId: webhookData.spaceId
    });
  } else if (webhookURL && signingSecret) {
    const secret = Buffer.from(signingSecret, 'hex');

    const signedJWT = await signJwt('webhook', webhookData, secret);
    try {
      // Call their endpoint with the event's data
      const response = await fetch(webhookURL, {
        method: 'POST',
        body: JSON.stringify(webhookData),
        headers: {
          Signature: signedJWT
        }
      });
      log.debug('Webhook call response', { ...response, spaceId: webhookData.spaceId });
    } catch (_) {
      log.error('Webhook call failed', { spaceId: webhookData.spaceId });
    }
  }
}

import { ExternalServiceError } from '@charmverse/core';

import { Webhook } from './coinbase';

export async function coinbaseVerifyRoute(rawBody: string, signature: string, sharedSecret: string) {
  try {
    const event = Webhook.verifyEventBody(rawBody, signature, sharedSecret);
    return event;
  } catch (e) {
    throw new ExternalServiceError('Coinbase verification failed');
  }
}

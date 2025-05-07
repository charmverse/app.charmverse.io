import { log } from '@charmverse/core/log';
import { SQS_WEBHOOK_COLLABLAND_QUEUE_NAME } from '@packages/lib/collabland/config';

import { processMessages } from '../../webhookSqs';

import { processWebhookMessage } from './webhook/processWebhookMessage';

log.info('Collabland Queue url:', SQS_WEBHOOK_COLLABLAND_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_COLLABLAND_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process collabland webhook messages job');
  await processMessages({ processorFn: processWebhookMessage, queueUrl });
}

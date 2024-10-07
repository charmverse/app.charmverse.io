import { log } from '@charmverse/core/log';

import { processMessages } from '../../webhookSqs';

import { SQS_WEBHOOK_GITHUB_QUEUE_NAME } from './constants';
import { processWebhookMessage } from './webhook/processWebhookMessage';

log.info('Github Queue url:', SQS_WEBHOOK_GITHUB_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_GITHUB_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process github webhook messages job');
  await processMessages({ processorFn: processWebhookMessage, queueUrl });
}

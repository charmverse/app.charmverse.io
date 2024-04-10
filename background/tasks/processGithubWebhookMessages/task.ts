import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { SQS_WEBHOOK_GITHUB_QUEUE_NAME } from 'lib/github/config';
import { processWebhookMessage } from 'lib/github/webhook/processWebhookMessage';

log.info('Github Queue url:', SQS_WEBHOOK_GITHUB_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_GITHUB_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process github webhook messages job');
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

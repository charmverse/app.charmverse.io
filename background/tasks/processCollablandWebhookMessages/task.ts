import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { SQS_WEBHOOK_COLLABLAND_QUEUE_NAME } from 'lib/collabland/config';
import { processWebhookMessage } from 'lib/collabland/webhook/processWebhookMessage';

log.info('Collabland Queue url:', SQS_WEBHOOK_COLLABLAND_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_COLLABLAND_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process collabland webhook messages job');
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

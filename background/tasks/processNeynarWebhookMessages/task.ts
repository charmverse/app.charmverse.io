import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { SQS_WEBHOOK_NEYNAR_QUEUE_NAME } from 'lib/neynar/constants';
import { processWebhookMessage } from 'lib/neynar/webhook/processWebhookMessage';

log.info('Neynar Queue url:', SQS_WEBHOOK_NEYNAR_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_NEYNAR_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process neynar webhook messages job');
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

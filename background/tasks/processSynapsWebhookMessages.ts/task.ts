import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { SQS_WEBHOOK_SYNAPS_QUEUE_NAME } from 'lib/kyc/config';
import { processWebhookMessage } from 'lib/kyc/synaps/webhook/processWebhookMessage';

log.info('Synaps Queue url:', SQS_WEBHOOK_SYNAPS_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_SYNAPS_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process synaps webhook messages job');
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

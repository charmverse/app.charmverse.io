import { log } from '@charmverse/core/log';
import { processMessages } from '@root/lib/aws/webhookSqs';
import { SQS_WEBHOOK_SYNAPS_QUEUE_NAME } from '@root/lib/kyc/config';
import { processWebhookMessage } from '@root/lib/kyc/synaps/webhook/processWebhookMessage';

const queueUrl = SQS_WEBHOOK_SYNAPS_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process synaps webhook messages job', { queueUrl });
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

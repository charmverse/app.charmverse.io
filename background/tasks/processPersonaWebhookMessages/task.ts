import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { SQS_WEBHOOK_PERSONA_QUEUE_NAME } from 'lib/kyc/config';
import { processWebhookMessage } from 'lib/kyc/persona/webhook/processWebhookMessage';

log.info('Persona Queue url:', SQS_WEBHOOK_PERSONA_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_PERSONA_QUEUE_NAME || '';

export async function task() {
  log.debug('Starting to process persona webhook messages job');
  processMessages({ processorFn: processWebhookMessage, queueUrl });
}

import { log } from '@charmverse/core/log';
import { SQS_WEBHOOK_MAILGUN_QUEUE_NAME } from '@root/lib/mailer/mailgunClient';

import { processMessages } from '../../webhookSqs';

import { processWebhookMessage } from './webhook/processWebhookMessage';

log.info('Mailgun Queue url:', SQS_WEBHOOK_MAILGUN_QUEUE_NAME);
const queueUrl = SQS_WEBHOOK_MAILGUN_QUEUE_NAME || '';

export async function task() {
  if (!queueUrl) {
    log.error('Mailgun queue url not found. Aborting process mailgun webhook messages job');
    return;
  }
  log.debug('Starting to process mailgun webhook messages job');
  await processMessages({ processorFn: processWebhookMessage, queueUrl });
}

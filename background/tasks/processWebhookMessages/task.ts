import { processMessages } from 'lib/aws/webhookSqs';
import log from 'lib/log';
import { processWebhookMessage } from 'lib/webhooks/processWebhookMessage';

export async function task() {
  log.debug('Starting to process webhook messages job');

  processMessages({ processorFn: processWebhookMessage });
}

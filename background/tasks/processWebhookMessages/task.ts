import { processMessages } from 'lib/aws/webhookSqs';
import log from 'lib/log';
import { processWebhookMessage } from 'lib/webhooks/processWebhookMessage';

export async function task() {
  log.debug('Running process webhook messages cron job');

  try {
    await processMessages({ processorFn: processWebhookMessage });
  } catch (error: any) {
    log.error(`Error processing webhook messages: ${error.stack || error.message || error}`, { error });
  }
}

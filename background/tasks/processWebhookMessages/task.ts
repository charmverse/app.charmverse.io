import { processMessages } from 'lib/aws/webhookSqs';
import log from 'lib/log';
import { processWebhookMessage } from 'lib/webhooks/processWebhookMessage';

export async function task() {
  log.debug('Running process webhook messages cron job');

  try {
    await processMessages({ processorFn: processWebhookMessage, maxNumOfMessages: 5 });
  } catch (error: any) {
    log.error(`Error deleting archived pages: ${error.stack || error.message || error}`, { error });
  }
}

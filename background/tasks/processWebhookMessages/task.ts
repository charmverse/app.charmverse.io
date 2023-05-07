import { log } from '@charmverse/core/log';

import { processMessages } from 'lib/aws/webhookSqs';
import { processWebhookMessage } from 'lib/webhookConsumer/processWebhookMessage';

export async function task() {
  log.debug('Starting to process webhook messages job');

  processMessages({ processorFn: processWebhookMessage });
}

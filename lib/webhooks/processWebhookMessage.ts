import type { MessageType, WebhookMessage } from 'lib/webhooks/interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage) => Promise<boolean>> = {
  // TODO - add processing logic for each message type
  remove_role: async (message: WebhookMessage) => true,
  add_role: async (message: WebhookMessage) => true,
  add_member: async (message: WebhookMessage) => true,
  remove_member: async (message: WebhookMessage) => true
};

export async function processWebhookMessage(message: WebhookMessage) {
  const data = message?.data;

  if (!data?.type || !messageHandlers[data?.type]) {
    // we cannot process this message, jsut remove it from queue
    return true;
  }

  const handler = messageHandlers[data?.type];

  return handler(message);
}

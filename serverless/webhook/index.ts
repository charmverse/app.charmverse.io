import type { Context, SQSEvent, SQSHandler } from 'aws-lambda';

/**
 * SQS worker logic goes there
 */
const webhookWorker: SQSHandler = (event: SQSEvent, context: Context) => {
  // SQS may be invoked with multiple messages
  for (const message of event.Records) {
    const bodyData = JSON.parse(message.body); // Message body

    // Gets message information
    // Connect to DB (with prisma) and get space's webhook config
    // Sign message and add it to header
    // Trigger HTTP call using space's setting
    // Expects 200 back
  }
};

export default webhookWorker;

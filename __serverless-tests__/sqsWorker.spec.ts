import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { webhookWorker } from 'serverless/handler';

import type { WebhookPayload } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

describe('SERVERLESS SQS worker', () => {
  it('should sign payload and execute websocket', async () => {
    const { space } = await generateUserAndSpace();
    const testWebhookPayload: WebhookPayload = {
      createdAt: new Date().toISOString(),
      event: {
        scope: WebhookEventNames.ProposalPassed,
        proposal: {
          createdAt: '',
          id: 'id',
          title: 'title',
          url: 'url',
          authors: []
        },
        space: {
          id: space.id,
          name: space.name,
          avatar: space.spaceImage ?? undefined,
          url: `https://app.charmverse.io/${space.domain}`
        }
      },
      webhookURL: space.webhookSubscriptionUrl || '',
      signingSecret: space.webhookSigningSecret || '',
      spaceId: space.id
    };

    const testRecord: SQSRecord = {
      body: JSON.stringify(testWebhookPayload),
      messageId: 'messageId',
      receiptHandle: '',
      attributes: {
        ApproximateReceiveCount: '',
        SenderId: '',
        SentTimestamp: '',
        ApproximateFirstReceiveTimestamp: ''
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: '',
      eventSourceARN: '',
      awsRegion: ''
    };

    const event: SQSEvent = {
      Records: [testRecord]
    };

    const res = await webhookWorker(event);

    // Means all the message were successful
    expect(res.batchItemFailures.length).toBe(0);
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@prisma/client';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { webhookWorker } from 'serverless/handler';

import type { WebhookPayload } from 'lib/webhook/interfaces';
import { WebhookEventNames } from 'lib/webhook/interfaces';
import type { LoggedInUser } from 'models';
import { loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: LoggedInUser;
let adminUserSpace: Space;
let adminCookie: string;

global.fetch = jest.fn().mockResolvedValueOnce({
  status: 200
});

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = await loginUser(adminUser.id);
});

describe('SERVERLESS webhook worker', () => {
  it('should sign payload and execute websocket', async () => {
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
          id: adminUserSpace.id,
          name: nonAdminUserSpace.name,
          avatar: nonAdminUserSpace.spaceImage,
          url: `https://app.charmverse.io/${nonAdminUserSpace.domain}`
        }
      },
      webhookURL: adminUserSpace.webhookSubscriptionUrl || '',
      signingSecret: adminUserSpace.webhookSigningSecret || '',
      spaceId: adminUserSpace.id
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

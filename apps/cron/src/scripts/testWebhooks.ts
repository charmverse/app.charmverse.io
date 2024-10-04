/* eslint-disable no-console */
import { processMessages } from '../webhookSqs';
import { POST } from '@charmverse/core/http';

// use this file and run against production to generate api keys

export async function testAddMessage() {
  const res = await POST(
    'https://webhooks.charmverse.co/collabland-events',
    {
      type: 'add_role',
      guild_id: '123-456-789',
      member: { discordId: '1234' },
      role: { id: 'example-uuid', name: 'role name' }
    },
    {
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer :api_key:'
      }
    }
  );

  console.log('🔥', res);
}

export async function testFetchMessages() {
  const processorFn = async () => ({ success: true });

  await processMessages({ processorFn, queueUrl: '' });
}

// testFetchMessages();
testAddMessage();

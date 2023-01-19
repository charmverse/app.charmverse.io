/* eslint-disable no-console */
import { processMessages } from 'lib/aws/webhookSqs';
import fetch from 'node-fetch';

// use this file and run against production to generate api keys


export async function testAddMessage()  {
  const res = await fetch('https://webhooks.charmverse.co/collabland-events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer :api_key:'
    },
    body: JSON.stringify({
      type: 'add_role',
      guild_id: '123-456-789',
      member: { discordId: '1234' },
      role: { id: 'example-uuid', name: 'role name' }
    })
  });

  console.log('🔥', res);
}

export async function testFetchMessages() {
  const processorFn = async () => ({ success: true });

  await processMessages({ processorFn });
}

testFetchMessages();
// testAddMessage();

/* eslint-disable no-console */
import fetch from 'node-fetch';

// use this file and run against production to generate api keys


export async function test()  {


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

test();
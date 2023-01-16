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
  const processorFn = async () => true;

  await processMessages({ processorFn });
}

testFetchMessages();
// testAddMessage();

const data = {
  event: 'guildMemberUpdate',
  payload: [
    {
      guildId: '889381536904904734',
      joinedTimestamp: 1644677954638,
      premiumSinceTimestamp: null,
      nickname: null,
      pending: false,
      communicationDisabledUntilTimestamp: null,
      userId: '829019255625875456',
      avatar: null,
      displayName: 'wishmaster',
      roles: ['942072530896830544', '942072632986177637', '889381536904904734'],
      avatarURL: null,
      displayAvatarURL: 'https://cdn.discordapp.com/avatars/829019255625875456/8e8649f7ffb6008b822872404f7990bc.webp'
    },
    {
      guildId: '889381536904904734',
      joinedTimestamp: 1644677954638,
      premiumSinceTimestamp: null,
      nickname: null,
      pending: false,
      communicationDisabledUntilTimestamp: null,
      userId: '829019255625875456',
      avatar: null,
      displayName: 'wishmaster',
      roles: ['904089148552527942', '942072530896830544', '942072632986177637', '889381536904904734'],
      avatarURL: null,
      displayAvatarURL: 'https://cdn.discordapp.com/avatars/829019255625875456/8e8649f7ffb6008b822872404f7990bc.webp'
    }
  ]
};

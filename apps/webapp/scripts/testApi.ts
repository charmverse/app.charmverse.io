/* eslint-disable no-console */

export {};

// use this file and test api keys
const apiDomain = 'https://app.charmverse.io';
const apiKey = process.env.API_KEY;

async function testCreateSpace() {
  try {
    const res = await fetch(apiDomain + '/api/v1/spaces', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name: 'API Test space',
        adminWalletAddress: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
        avatar: 'https://nftstorage.link/ipfs/bafybeidtbz346s5mpdklyyrq6czzpcf3unyytjm5aqqlndxq2welvcsxci',
        template: 'nft_community'
      })
    });

    console.log('🔥', res);
  } catch (error) {
    console.error(error);
  }
}

testCreateSpace();

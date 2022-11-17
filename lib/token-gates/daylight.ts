import type { TokenGate } from '@prisma/client';
import type { AccessControlCondition } from 'lit-js-sdk';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';

import { getAccessType } from './utils';

export async function addToDaylight (spaceId: string, tokenGate: TokenGate, conditions: AccessControlCondition[]) {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    return;
  }
  const filteredConditions = conditions.filter(condition => getAccessType(condition) === 'individual_wallet' || 'individual_nft' || 'group_token_or_nft');
  if (filteredConditions.length !== conditions.length) {
    return;
  }
  let chain = '';
  let address = '';

  for (let i = 0; i < filteredConditions.length; i++) {
    const element = filteredConditions[i];
    chain = element.chain;
    address = element.contractAddress;
  }

  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Bearer ${process.env.DAYLIGHT_API_KEY}` },
    body: JSON.stringify({
      // eslint-disable-next-line object-shorthand
      requirements: [{ chain: chain, type: 'hasTokenBalance', address: address }],
      action: { completedBy: [{ chain: 'ethereum' }], linkUrl: `${baseUrl}/join?domain=${space.domain}` },
      title: `Join CharmVerse's workspace ${space.domain}`,
      sourceId: tokenGate.id,
      type: 'access',
      isActive: true
    })
  };

  await fetch('https://api.daylight.xyz/v1/abilities', options)
    .then(response => response.json())
  // eslint-disable-next-line no-console
    .then(response => console.log(response))
  // eslint-disable-next-line no-console
    .catch(err => console.error(err));
}

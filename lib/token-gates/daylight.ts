import type { TokenGate } from '@prisma/client';
import type { AccessControlCondition } from 'lit-js-sdk';
import { flatten } from 'lodash';

import { prisma } from 'db';

import { getAccessType } from './utils';

export async function addToDaylight (spaceId: string, tokenGate: TokenGate) {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    return;
  }

  const conditions: AccessControlCondition[] = flatten((tokenGate.conditions as any)?.unifiedAccessControlConditions);

  const supportedTypes = ['individual_wallet', 'individual_nft', 'group_token_or_nft'];
  const filteredConditions = conditions.filter(condition => supportedTypes.includes(getAccessType(condition)));
  if (filteredConditions.length !== conditions.length) {
    return;
  }

  const createdRequirements = [];
  for (let i = 0; i < filteredConditions.length; i++) {
    const element = filteredConditions[i];
    const { method, parameters } = element;

    if (!method && parameters.includes(':userAddress')) {
      createdRequirements.push({ chain: element.chain, type: 'onAllowlist', addresses: [element.returnValueTest.value] });
    }

    switch (method) {
      case 'balanceOf': createdRequirements.push({ chain: element.chain,
        type: 'hasTokenBalance',
        address: element.contractAddress,
        minAmount: element.returnValueTest.value });
        break;
      case 'ownerOf': createdRequirements.push({
        chain: element.chain,
        type: 'hasNftWithSpecificId',
        address: element.contractAddress,
        id: element.parameters
      });
        break;
      default:
          // do nothing
    }
  }

  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Bearer ${process.env.DAYLIGHT_API_KEY}` },
    body: JSON.stringify({
      requirements: createdRequirements,
      action: { linkUrl: `https//:charmverse.io/join?domain=${space.domain}` },
      title: 'workspace',
      type: 'access',
      isActive: true,
      sourceId: tokenGate.id
    })
  };

  await fetch('https://api.daylight.xyz/v1/abilities', options)
    .then(response => response.json())
  // eslint-disable-next-line no-console
    .then(response => console.log(response))
  // eslint-disable-next-line no-console
    .catch(err => console.error(err));
}

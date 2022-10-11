import type { AccessControlCondition } from 'lit-js-sdk';

import type { TokenGateAccessType } from 'lib/token-gates/interfaces';

export function getAccessType (condition: AccessControlCondition): TokenGateAccessType {

  const { method, parameters } = condition;

  if (!method && parameters.includes(':userAddress')) {
    return 'individual_wallet';
  }

  switch (method) {
    case 'ownerOf': return 'individual_nft';

    case 'eventId': return 'poap_collectors';

    case 'members': return 'dao_members';

    case 'getActiveSubscriptionCount': return 'cask_subscribers';

    case 'balanceOf':
    case 'eth_getBalance':
      return 'group_token_or_nft';

    default: return 'group_token_or_nft';
  }
}

export function getAccessTypes (conditions: AccessControlCondition[]): TokenGateAccessType[] {
  return conditions.map(c => getAccessType(c));
}

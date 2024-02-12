import type { AccsDefaultParams } from '@lit-protocol/types';

import type { TokenGateAccessType } from 'lib/tokenGates/interfaces';

export function getAccessType(condition: AccsDefaultParams): TokenGateAccessType {
  const { method, parameters } = condition;

  if (!method && parameters.includes(':userAddress')) {
    return 'individual_wallet';
  }

  switch (method) {
    case 'ownerOf':
      return 'individual_nft';

    case 'eventId':
      return 'poap_collectors';

    case 'members':
      return 'dao_members';

    case 'balanceOf':
    case 'eth_getBalance':
      return 'group_token_or_nft';

    default:
      return 'group_token_or_nft';
  }
}

export function getAccessTypes(conditions: AccsDefaultParams[]): TokenGateAccessType[] {
  return conditions.map((c) => getAccessType(c));
}


import { TokenGate } from '@prisma/client';
import { Chain, AccessControlCondition, SigningConditions } from 'lit-js-sdk';

export function getChainFromGate (tokenGate: TokenGate): Chain {
  return getChainFromConditions(tokenGate.conditions as any);
}

export function getChainFromConditions (conditions: Partial<SigningConditions>): Chain {
  return (conditions.accessControlConditions?.[0] as AccessControlCondition[])[0]?.chain
    || (conditions.accessControlConditions?.[0] as AccessControlCondition).chain
    || 'ethereum';
}

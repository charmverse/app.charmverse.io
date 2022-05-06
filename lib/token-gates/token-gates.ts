
import { TokenGate } from '@prisma/client';
import { ALL_LIT_CHAINS, Chain, AccessControlCondition, SigningConditions } from 'lit-js-sdk';

export function getChainFromGate (tokenGate: TokenGate): Chain {
  return getChainFromConditions(tokenGate.conditions as any);
}

export function getChainFromConditions (conditions: Partial<SigningConditions>): Chain {
  return (conditions.accessControlConditions?.[0] as AccessControlCondition[])[0]?.chain
    || (conditions.accessControlConditions?.[0] as AccessControlCondition).chain
    || 'ethereum';
}

// default to 1 (ethereum) otherwise lit falls back to solana, which has no chainId!
export function getLitChainFromChainId (chainId: number = 1): Chain {
  const litChain = Object.entries(ALL_LIT_CHAINS).find(([, c]) => c.chainId === chainId);
  return (litChain?.[0] || 'ethereum') as Chain;
}

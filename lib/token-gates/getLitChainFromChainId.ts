import { ALL_LIT_CHAINS } from '@lit-protocol/constants';
import type { Chain, LITEVMChain } from '@lit-protocol/types';

// default to 1 (ethereum) otherwise lit falls back to solana, which has no chainId!
export default function getLitChainFromChainId(chainId: number = 1): Chain {
  const litChain = Object.entries(ALL_LIT_CHAINS).find(([, c]) => (c as LITEVMChain).chainId === chainId);
  return (litChain?.[0] || 'ethereum') as Chain;
}

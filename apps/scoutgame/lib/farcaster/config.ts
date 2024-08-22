import { optimism } from 'viem/chains';

export const warpcastConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'charmverse.io',
  siweUri: 'https://app.charmverse.io/login',
  provider: optimism
} as const;

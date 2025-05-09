import { isTestEnv } from '@packages/config/constants';
import { ZDK, ZDKNetwork, ZDKChain } from '@zoralabs/zdk';
import { RateLimit } from 'async-sema';

// Ref: https://docs.zora.co/docs/zora-api/zdk
// NFT example: https://docs.zora.co/docs/guides/zdk-intro-guide

const networks = [
  { network: ZDKNetwork.Zora, chain: ZDKChain.ZoraMainnet },
  { network: ZDKNetwork.Zora, chain: ZDKChain.ZoraGoerli }
];

const API_ENDPOINT = 'https://api.zora.co/graphql';

// 30 requests/minute with no api key
export const rateLimiter = RateLimit(0.5);

export function getClient() {
  if (isTestEnv) {
    // zora api doesn't require an api key, so don't use it in test mode
    return null;
  }
  return new ZDK({
    endpoint: API_ENDPOINT,
    networks,
    apiKey: process.env.ZORA_API_KEY
  });
}

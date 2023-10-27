import { ZDK, ZDKNetwork, ZDKChain } from '@zoralabs/zdk';
import { RateLimit } from 'async-sema';

import { isTestEnv } from 'config/constants';

// Ref: https://docs.zora.co/docs/zora-api/zdk

const networkInfo = { network: ZDKNetwork.Ethereum, chain: ZDKChain.Mainnet };
const API_ENDPOINT = 'https://api.zora.co/graphql';
const args = { endPoint: API_ENDPOINT, networks: [networkInfo], apiKey: process.env.ZORA_API_KEY };

// 30 requests/minute with no api
export const rateLimiter = RateLimit(0.5);

export function getClient() {
  if (isTestEnv) {
    // zora api doesn't require an api key, so don't use it in test mode
    return null;
  }
  return new ZDK(args); // All arguments are optional
}

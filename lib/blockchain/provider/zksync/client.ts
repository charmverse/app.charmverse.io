import { RateLimit } from 'async-sema';
import * as zksync from 'zksync';

import { supportedNetworks, type SupportedChainId } from './config';
// --------------------------------------------------

// Ref: https://docs.zora.co/docs/zora-api/zdk
// NFT example: https://docs.zora.co/docs/guides/zdk-intro-guide
export const ZK_ERA_API_ENDPOINT = 'https://api.zksync.io/jsrpc';
const ZK_ERA_TEST_API_ENDPOINT = 'https://goerli-api.zksync.io/jsrpc';

// 30 requests/minute with no api key
export const rateLimiter = RateLimit(0.5);

// See source docs
// https://docs.zksync.io/api/sdk/js/providers/#zksync-provider
export function getClient({ chainId }: { chainId: SupportedChainId }) {
  if (!supportedNetworks.includes(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }

  return zksync.Provider.newHttpProvider(chainId === 324 ? ZK_ERA_API_ENDPOINT : ZK_ERA_TEST_API_ENDPOINT);
}

const wallet1 = '0xf33a57b5b611ba41c9867d91debcd87ae4fd981d';
const wallet2 = '0xeb6bfb66b44d2a7aafd9b97dd02e77b99360bcbb';

// getClient({ chainId: 324 })
//   .then((client) => Promise.all([client.getState(wallet2)]))
//   .then((data) => console.log(JSON.stringify(data, null, 2)));

import env from '@beam-australia/react-env';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { base } from 'viem/chains';

import { ContractApiClient } from './nftContractApiClient';

export const decentApiKey =
  env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string) || '4f081ef9fb975f01984f605620489dfb';

const nftChain = base;

export const builderContractAddress = nftChain.id === base.id ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27' : 'NULL';

// Test
const readonlyClient = getPublicClient(nftChain.id);

export const readonlyApiClient = new ContractApiClient({
  chain: nftChain,
  contractAddress: builderContractAddress,
  publicClient: readonlyClient
});

// readonlyApiClient.getPriceIncrement().then(console.log);

// writeApiClient.adjustPriceIncrement({ args: { newPriceIncrement: BigInt(10000000000000) } }).then(console.log);

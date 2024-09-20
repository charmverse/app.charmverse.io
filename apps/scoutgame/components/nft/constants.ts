import env from '@beam-australia/react-env';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import type { Chain } from 'viem/chains';
import { base, baseSepolia } from 'viem/chains';

import { ContractApiClient } from './nftContractApiClient';

export const decentApiKey =
  env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string) || '4f081ef9fb975f01984f605620489dfb';

export const builderNftChain: Chain = baseSepolia;

export const builderContractAddress =
  builderNftChain.id === base.id
    ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27'
    : '0x98098059e6af2eb49e32cf336a6e61c91b85c81f';

// Test
const readonlyClient = getPublicClient(builderNftChain.id);

export const readonlyApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: readonlyClient
});

const writeApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  walletClient: getWalletClient({ chainId: builderNftChain.id, privateKey: process.env.PRIVATE_KEY })
});

const demoBuilderId = '47a44707-d672-4136-b0ff-9144c049ffb1';

// readonlyApiClient.getPriceIncrement().then(console.log);

// readonlyApiClient.getTokenIdForBuilder({ args: { builderId: demoBuilderId } }).then(console.log);

// readonlyApiClient.getTokenPurchasePrice({ args: { amount: BigInt(100), tokenId: BigInt(1) } }).then(console.log);

// readonlyApiClient.getBuilderIdForToken({ args: { tokenId: BigInt(1) } }).then(console.log);

// WRITE ----------
// writeApiClient.adjustPriceIncrement({ args: { newPriceIncrement: BigInt(10000000000000) } }).then(console.log);

// writeApiClient.registerBuilderToken({ args: { builderId: demoBuilderId } }).then(console.log);

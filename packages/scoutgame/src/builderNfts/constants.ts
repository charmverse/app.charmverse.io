import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { Chain } from 'viem/chains';
import { base, baseSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

/**
 * Currently priced in USDC
 */
export const builderTokenDecimals = 6;

export const builderNftChain: Chain = baseSepolia;

if (builderNftChain.id !== baseSepolia.id) {
  log.warn('Builder NFT chain is not on Base Sepolia');
}

export const builderContractAddress =
  // @ts-ignore - Leaving for later
  builderNftChain.id === base.id
    ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27'
    : // New version only on Sepolia for now
      '0xec66b6a6c2ce744543517776ff9906cd41c50a63';

export const usdcBaseSepoliaContractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const usdcBaseMainnetContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const currentSeason = 1;

export const builderSmartContractOwnerKey = process.env.BUILDER_SMART_CONTRACT_OWNER_PRIVKEY as string;

// const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

// const apiClient = new ContractApiClient({
//   chain: builderNftChain,
//   contractAddress: builderContractAddress,
//   walletClient: serverClient
// });

// apiClient
//   .mint({
//     args: {
//       account: '0x4A29c8fF7D6669618580A68dc691565B07b19e25',
//       tokenId: BigInt(1),
//       amount: BigInt(1)
//     }
//   })
//   .then(console.log);

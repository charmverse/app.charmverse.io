import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { Address } from 'viem';
import type { Chain } from 'viem/chains';
import { base, baseSepolia, optimismSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

/**
 * Currently priced in USDC
 */
export const builderTokenDecimals = 6;

export const builderNftChain: Chain = optimismSepolia;

if (builderNftChain.id !== optimismSepolia.id) {
  log.warn(`Builder NFT chain is using "${builderNftChain.name}" not Optimisma Sepolia`);
}

// OP Sepolia version
export const builderContractAddress = '0xc6534d33bc65e319fb082e82c0b56bd4d9854aaf';

export const usdcBaseSepoliaContractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const usdcBaseMainnetContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const builderSmartContractOwnerKey = process.env.BUILDER_SMART_CONTRACT_OWNER_PRIVKEY as string;

// const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

// const apiClient = new BuilderNFTSeasonOneClient({
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

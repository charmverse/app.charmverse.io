import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { Chain } from 'viem/chains';
import { optimism, optimismSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const useTestnets = false;

/**
 * Currently priced in USDC
 */
export const builderTokenDecimals = 6;

export const builderNftChain: Chain = useTestnets ? optimismSepolia : optimism;

if (builderNftChain.id !== optimism.id) {
  log.warn(`Builder NFT chain is using "${builderNftChain.name}" not Optimism`);
}

// Actual contract for interacting with NFTs
export const optimismSepoliaBuilderContractAddress = '0xc6534d33bc65e319fb082e82c0b56bd4d9854aaf';
export const optimismMainnetBuilderContractAddress = '0x7df4d9f54a5cddfef50a032451f694d6345c60af';

export const builderContractAddress = useTestnets
  ? optimismSepoliaBuilderContractAddress
  : optimismMainnetBuilderContractAddress;

// USDC Contract we use for payments
export const usdcOptimismSepoliaContractAddress = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
export const usdcOptimismMainnetContractAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

export const usdcContractAddress = useTestnets
  ? usdcOptimismSepoliaContractAddress
  : usdcOptimismMainnetContractAddress;

export const builderSmartContractOwnerKey = process.env.BUILDER_SMART_CONTRACT_OWNER_PRIVKEY as string;

export const treasuryAddress = '0x9b56c451f593e1BF5E458A3ecaDfD3Ef17A36998';
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

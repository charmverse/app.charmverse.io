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
export const optimismSepoliaBuilderContractAddress = '0x04ecb09a6fc12d86e3c6354f1bc088807fd45b78';
export const optimismMainnetBuilderContractAddress = '0x7b3eae98661cc29f7bd6ab399f0f6ddea407a17e';

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

// Actual target wallet
export const treasuryAddress = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';
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

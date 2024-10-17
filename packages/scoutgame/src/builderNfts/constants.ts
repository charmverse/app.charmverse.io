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
export const builderCreatorAddress = '0x518AF6fA5eEC4140e4283f7BDDaB004D45177946';

if (builderNftChain.id !== optimism.id) {
  log.warn(`Builder NFT chain is using "${builderNftChain.name}" not Optimism`);
}

// Dev contracts we also deployed for easier use
const devOptimismSepoliaBuildersContract = '0x2f6093b70562729952bf379633dee3e89922d717';
const devOptimismMainnetBuildersContract = '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd';

const realOptimismSepoliaBuildersContract = '0x0b7342761a10e1b14df427681b967e67f5e6cef9';
export const realOptimismMainnetBuildersContract = '0x743ec903fe6d05e73b19a6db807271bb66100e83';

export function getBuilderContractAddress(): `0x${string}` {
  return (env('BUILDER_NFT_CONTRACT_ADDRESS') || process.env.REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS) as `0x${string}`;
}

// USDC Contract we use for payments
export const usdcOptimismSepoliaContractAddress = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
export const usdcOptimismMainnetContractAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

export const optimismUsdcContractAddress = useTestnets
  ? usdcOptimismSepoliaContractAddress
  : usdcOptimismMainnetContractAddress;

export const builderSmartContractOwnerKey = process.env.BUILDER_SMART_CONTRACT_OWNER_PRIVKEY as string;

// Actual target wallet - Scoutgame.eth
export const treasuryAddress = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';

export function getDecentApiKey() {
  const apiKey = env('DECENT_API_KEY') || process.env.REACT_APP_DECENT_API_KEY;
  return apiKey;
}

export const scoutPointsShare = 0.8;
export const builderPointsShare = 0.2;

// Selecting the top 100 builders
export const weeklyRewardableBuilders = 100;

// const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

// const apiClient = new BuilderNFTSeasonOneClient({
//   chain: builderNftChain,
//   contractAddress: getBuilderContractAddress(),
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

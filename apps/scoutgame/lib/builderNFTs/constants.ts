import env from '@beam-australia/react-env';
import type { Chain } from 'viem/chains';
import { base, baseSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const builderNftChain: Chain = baseSepolia;

if (builderNftChain.id !== baseSepolia.id) {
  throw new Error('Builder NFT chain must be Base Sepolia till we finalise the contract');
}

export const builderContractAddress =
  // @ts-ignore - Leaving for later
  builderNftChain.id === base.id
    ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27'
    : // New version only on Sepolia for now
      '0x98098059e6af2eb49e32cf336a6e61c91b85c81f';

export const usdcBaseSepoliaContractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const usdcBaseMainnetContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const currentSeason = 1;

export const builderSmartContractOwnerKey = process.env.BUILDER_SMART_CONTRACT_OWNER_PRIVKEY as string;

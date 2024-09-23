import env from '@beam-australia/react-env';
import type { Chain } from 'viem/chains';
import { base, baseSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const builderNftChain: Chain = base;

export const builderContractAddress =
  builderNftChain.id === base.id
    ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27'
    : '0x98098059e6af2eb49e32cf336a6e61c91b85c81f';

// Proxy: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
export const usdcBaseSepoliaContractAddress = '0xd74cc5d436923b8ba2c179b4bca2841d8a52c5b5';

// Proxy: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
export const usdcBaseMainnetContractAddress = '0x2Ce6311ddAE708829bc0784C967b7d77D19FD779';

export const currentSeason = 1;

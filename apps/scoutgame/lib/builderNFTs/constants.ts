import env from '@beam-australia/react-env';
import type { Chain } from 'viem/chains';
import { base, baseSepolia } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const builderNftChain: Chain = baseSepolia;

export const builderContractAddress =
  builderNftChain.id === base.id
    ? '0x278cc8861cfc93ea47c9e89b1876d0def2037c27'
    : '0x98098059e6af2eb49e32cf336a6e61c91b85c81f';

export const currentSeason = 1;

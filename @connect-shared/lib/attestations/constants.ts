import { isDevEnv, isProdEnv, isStagingEnv, isTestEnv } from '@root/config/constants';
import { optimism, optimismSepolia } from 'viem/chains';

export const gitcoinProjectAttestationChainId =
  isProdEnv && !isDevEnv && !isTestEnv && !isStagingEnv ? optimism.id : optimismSepolia.id;
export const projectAttestationIssuerName = 'CharmVerse';

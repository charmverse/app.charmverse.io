import { Web3ReactProvider as DefaultWeb3ReactProvider } from '@web3-react/core';
import dynamic from 'next/dynamic';

import { isDevEnv } from 'config/constants';

export const Web3ReactProvider = isDevEnv
  ? dynamic(() => import('@web3-react/core').then((i) => i.Web3ReactProvider), {
      ssr: false
    })
  : DefaultWeb3ReactProvider;

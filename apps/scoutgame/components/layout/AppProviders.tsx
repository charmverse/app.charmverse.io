import 'server-only';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { getConfig } from '../../lib/auth/wagmiConfig';
import { WagmiProvider } from '../common/WalletLogin/WagmiProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <WagmiProvider initialState={wagmiInitialState}>{children}</WagmiProvider>;
}

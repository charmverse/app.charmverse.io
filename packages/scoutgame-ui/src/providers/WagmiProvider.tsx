'use client';

import { log } from '@charmverse/core/log';
import { getBrowserPath, isTouchDevice, isWebView } from '@packages/utils/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { WagmiProvider as OriginalWagmiProvider, cookieToInitialState } from 'wagmi';

import { getConfig } from './wagmiConfig';

function useMetamaskInterceptor() {
  useEffect(() => {
    function handleLinkClick(event: MouseEvent) {
      const metamaskButton = (event.target as Element).closest('[data-testid=rk-wallet-option-metaMask]');
      if (metamaskButton && !isWebView(navigator.userAgent)) {
        log.debug('Send user to Metamask', { ua: navigator.userAgent, platform: navigator.platform });
        event.stopImmediatePropagation();
        window.location.replace(getMMDeeplink());
      }
    }

    if (isTouchDevice()) {
      // passing true in the 3rd argument means listen in the capture phase
      document.addEventListener('click', handleLinkClick, true);
    }

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, []);

  return null;
}

function getMMDeeplink() {
  const currentUrl = window.location.host + getBrowserPath();
  // use a custom scheme to avoid redirect to the app store
  // this breaks if user does not have metamask installed but its a decent tradeoff
  const deeplink = `dapp://${currentUrl}`;
  // https://metamask.app.link/dapp/${currentUrl}
  return deeplink;
}

// Use this provider for SSR https://wagmi.sh/react/guides/ssr, if we need it
export function WagmiProvider({
  children,
  cookie,
  walletConnectProjectId
}: {
  children: React.ReactNode;
  cookie?: string;
  walletConnectProjectId?: string;
}) {
  const [config] = useState(() => getConfig({ projectId: walletConnectProjectId || '' }));
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(config, cookie);
  useMetamaskInterceptor();

  return (
    <OriginalWagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OriginalWagmiProvider>
  );
}

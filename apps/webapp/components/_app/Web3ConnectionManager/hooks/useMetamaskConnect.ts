import MetaMaskOnboarding from '@metamask/onboarding';
import { useRef } from 'react';

import { getBrowserPath, isTouchScreen } from '@packages/lib/utils/browser';

const MM_DEEPLINK_SCHEMA = 'https://metamask.app.link/dapp/';

export function useMetamaskConnect(handleConnect: () => void) {
  const isMobile = isTouchScreen();
  const hasMMInjected = typeof window !== 'undefined' && MetaMaskOnboarding.isMetaMaskInstalled();

  // initialize metamask onboarding
  const onboarding = useRef<MetaMaskOnboarding>();
  if (typeof window !== 'undefined') {
    onboarding.current = new MetaMaskOnboarding();
  }

  const handleOnboarding = () => onboarding.current?.startOnboarding();
  const label =
    (typeof window !== 'undefined' && MetaMaskOnboarding.isMetaMaskInstalled()) || isMobile
      ? 'MetaMask'
      : 'Install MetaMask';

  const connectMetamask = () => {
    if (hasMMInjected) {
      handleConnect();
    } else if (isMobile) {
      // deep link to MM app or store
      window.location.replace(getMMDeeplink());
    } else {
      handleOnboarding();
    }
  };

  return { label, connectMetamask };
}

function getMMDeeplink() {
  const currentUrl = window.location.host + getBrowserPath();
  const deeplink = MM_DEEPLINK_SCHEMA + currentUrl;

  return deeplink;
}

import MetaMaskOnboarding from '@metamask/onboarding';
import ArrowSquareOut from '@mui/icons-material/Launch';
import { Grid, IconButton, Typography } from '@mui/material';
// eslint-disable-next-line import/no-extraneous-dependencies
import Alert from '@mui/material/Alert';
import UAuth from '@uauth/js';
import type { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { injected, walletConnect, walletLink } from 'connectors';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import ErrorComponent from 'components/common/errors/WalletError';
import Link from 'components/common/Link';
import { DialogTitle, Modal } from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';
import log from 'lib/log';
import { BrowserPopupError } from 'lib/utilities/errors';

import ConnectorButton from './components/ConnectorButton';
import processConnectionError from './utils/processConnectionError';

type Props = {
  activatingConnector?: AbstractConnector;
  setActivatingConnector: (connector?: AbstractConnector) => void;
  isModalOpen: boolean;
  closeModal: () => void;
  openNetworkModal: () => void;
  setIsConnectingIdentity: (isConnectingIdentity: boolean) => void;
};

function WalletSelectorModal({
  activatingConnector,
  setActivatingConnector,
  isModalOpen,
  closeModal,
  openNetworkModal, // Passing as prop to avoid dependency cycle
  setIsConnectingIdentity
}: Props) {
  const { error } = useWeb3React();
  const { active, activate, connector, setError } = useWeb3React();
  const { showMessage } = useSnackbar();

  const [uAuthPopupError, setUAuthPopupError] = useState<BrowserPopupError | null>(null);

  // initialize metamask onboarding
  const onboarding = useRef<MetaMaskOnboarding>();
  if (typeof window !== 'undefined') {
    onboarding.current = new MetaMaskOnboarding();
  }

  const handleConnect = (_connector: AbstractConnector) => {
    setActivatingConnector(_connector);
    activate(_connector, undefined, true).catch((err) => {
      setActivatingConnector(undefined);
      // We need to reset walletconnect if users have closed the modal
      resetWalletConnector(_connector);
      setError(err);
      if (connector) {
        // revert to previous connector
        return activate(connector, undefined, true);
      }
    });
  };
  const handleOnboarding = () => onboarding.current?.startOnboarding();

  // close the modal after signing in
  useEffect(() => {
    if (active) closeModal();
  }, [active]);

  useEffect(() => {
    if (!isModalOpen) {
      setUAuthPopupError(null);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (error instanceof UnsupportedChainIdError) {
      closeModal();
      openNetworkModal();
    }
  }, [error, openNetworkModal, closeModal]);

  const clientID = process.env.NEXT_PUBLIC_UNSTOPPABLE_DOMAINS_CLIENT_ID as string;
  const redirectUri = typeof window === 'undefined' ? '' : window.location.origin;
  log.debug('UAuth meta', { redirectUri, clientID });

  async function handleAuth() {
    const uauth = new UAuth({
      clientID,
      redirectUri,
      scope: 'openid wallet'
    });

    setIsConnectingIdentity(true);
    try {
      const authSig = (await uauth.loginWithPopup()) as any as UnstoppableDomainsAuthSig;
      showMessage(`Logged in with Unstoppable Domains. Redirecting you now.`, 'success');
      await charmClient.profile.loginWithUnstoppableDomains({ authSig });
      // This component is above all our data providers in the hierarchy, so we can just reload to open the app with a logged in cookie
      window.location.reload();
    } catch (err) {
      if ((err as Error).message.match('failed to be constructed')) {
        setUAuthPopupError(new BrowserPopupError());
      }
      setIsConnectingIdentity(false);
      log.error(err);
    }
  }

  return (
    <Modal open={isModalOpen} onClose={closeModal}>
      <DialogTitle onClose={closeModal}>Connect to a wallet</DialogTitle>
      <ErrorComponent error={error} processError={processConnectionError} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ConnectorButton
            name={
              typeof window !== 'undefined' && MetaMaskOnboarding.isMetaMaskInstalled()
                ? 'MetaMask'
                : 'Install MetaMask'
            }
            onClick={
              typeof window !== 'undefined' && MetaMaskOnboarding.isMetaMaskInstalled()
                ? () => handleConnect(injected)
                : handleOnboarding
            }
            iconUrl='metamask.png'
            disabled={connector === injected || !!activatingConnector}
            isActive={connector === injected}
            isLoading={activatingConnector === injected}
          />
        </Grid>
        <Grid item xs={12}>
          <ConnectorButton
            name='WalletConnect'
            onClick={() => handleConnect(walletConnect)}
            iconUrl='walletconnect.svg'
            disabled={connector === walletConnect || !!activatingConnector}
            isActive={connector === walletConnect}
            isLoading={activatingConnector === walletConnect}
          />
        </Grid>
        <Grid item xs={12}>
          <ConnectorButton
            name='Coinbase Wallet'
            onClick={() => handleConnect(walletLink)}
            iconUrl='coinbasewallet.png'
            disabled={connector === walletLink || !!activatingConnector}
            isActive={connector === walletLink}
            isLoading={activatingConnector === walletLink}
          />
        </Grid>
        <Grid item xs={12}>
          <ConnectorButton
            name='Unstoppable Domains'
            onClick={handleAuth}
            iconUrl='unstoppable-domains.png'
            disabled={connector === walletLink || !!activatingConnector}
            isActive={connector === walletLink}
            isLoading={activatingConnector === walletLink}
          />
          {uAuthPopupError && (
            <Alert severity='warning'>
              Could not open the popup. Please ensure popups are enabled for this site in your browser.
            </Alert>
          )}
        </Grid>
        <Grid item>
          <Typography variant='caption' align='center'>
            New to Ethereum wallets?{' '}
            <Link color='primay' href='https://ethereum.org/en/wallets/' external target='_blank'>
              Learn more
              <IconButton size='small' sx={{ color: 'inherit' }}>
                <ArrowSquareOut fontSize='small' />
              </IconButton>
            </Link>
          </Typography>
        </Grid>
      </Grid>
    </Modal>
  );
}

function resetWalletConnector(connector: AbstractConnector) {
  if (connector && connector instanceof WalletConnectConnector) {
    connector.walletConnectProvider = undefined;
  }
}

export default WalletSelectorModal;

import ArrowSquareOut from '@mui/icons-material/Launch';
import { Grid, IconButton, Typography } from '@mui/material';
// eslint-disable-next-line import/no-extraneous-dependencies
import Alert from '@mui/material/Alert';
import UAuth from '@uauth/js';
import type { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext, useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useMetamaskConnect } from 'components/_app/Web3ConnectionManager/hooks/useMetamaskConnect';
import ErrorComponent from 'components/common/errors/WalletError';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import type { AnyIdPostLoginHandler } from 'components/login/Login';
import { useSnackbar } from 'hooks/useSnackbar';
import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';
import { extractDomainFromProof } from 'lib/blockchain/unstoppableDomains/client';
import log from 'lib/log';
import { BrowserPopupError } from 'lib/utilities/errors';

import { Web3Connection } from '../../Web3ConnectionManager';

import { ConnectorButton } from './components/ConnectorButton';
import processConnectionError from './utils/processConnectionError';

interface Props {
  loginSuccess: AnyIdPostLoginHandler<'UnstoppableDomain' | 'Wallet'>;
}

export function WalletSelector({ loginSuccess }: Props) {
  const {
    setActivatingConnector,
    isWalletSelectorModalOpen,
    closeWalletSelectorModal,
    openNetworkModal,
    setIsConnectingIdentity,
    isConnectingIdentity,
    activatingConnector
  } = useContext(Web3Connection);
  const { error } = useWeb3React();
  const { active, activate, connector, setError } = useWeb3React();

  const { showMessage } = useSnackbar();

  const [uAuthPopupError, setUAuthPopupError] = useState<BrowserPopupError | null>(null);
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

  const { label, connectMetamask } = useMetamaskConnect(() => handleConnect(injected));

  // close the modal after signing in
  useEffect(() => {
    if (active) {
      closeWalletSelectorModal();
    }
  }, [active]);

  useEffect(() => {
    if (!isWalletSelectorModalOpen) {
      setUAuthPopupError(null);
    }
  }, [isWalletSelectorModalOpen]);

  useEffect(() => {
    if (error instanceof UnsupportedChainIdError) {
      closeWalletSelectorModal();
      openNetworkModal();
    }
  }, [error, openNetworkModal, closeWalletSelectorModal]);

  const clientID = process.env.NEXT_PUBLIC_UNSTOPPABLE_DOMAINS_CLIENT_ID as string;
  const redirectUri = typeof window === 'undefined' ? '' : window.location.origin;

  async function handleUnstoppableDomainsLogin() {
    const uauth = new UAuth({
      clientID,
      redirectUri,
      scope: 'openid wallet'
    });

    setIsConnectingIdentity(true);
    try {
      const authSig = (await uauth.loginWithPopup()) as any as UnstoppableDomainsAuthSig;
      showMessage(`Logged in with Unstoppable Domains. Redirecting you now.`, 'success');
      const user = await charmClient.profile.loginWithUnstoppableDomains({ authSig });

      const domain = extractDomainFromProof(authSig);

      loginSuccess({ displayName: domain, identityType: 'UnstoppableDomain', user });
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
    <div>
      <ErrorComponent error={error} processError={processConnectionError} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ConnectorButton
            name={label}
            onClick={connectMetamask}
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
            onClick={handleUnstoppableDomainsLogin}
            iconUrl='unstoppable-domains.png'
            disabled={false}
            isActive={false}
            isLoading={isConnectingIdentity}
          />
          {uAuthPopupError && (
            <Alert severity='warning'>
              Could not open Unstoppable Domains. Please ensure popups are enabled for the CharmVerse site in your
              browser.
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
    </div>
  );
}

function resetWalletConnector(connector: AbstractConnector) {
  if (connector && connector instanceof WalletConnectConnector) {
    connector.walletConnectProvider = undefined;
  }
}
export function WalletSelectorModal({ loginSuccess }: Props) {
  const { isWalletSelectorModalOpen, closeWalletSelectorModal } = useContext(Web3Connection);
  return (
    <Modal open={isWalletSelectorModalOpen} onClose={closeWalletSelectorModal}>
      <WalletSelector loginSuccess={loginSuccess} />
    </Modal>
  );
}

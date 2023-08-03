import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma';
import ArrowSquareOut from '@mui/icons-material/Launch';
import { Grid, IconButton, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
// eslint-disable-next-line import/no-extraneous-dependencies
import type { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { injected, walletConnect, walletLink } from 'connectors';
import { WalletConnectV2Connector } from 'connectors/walletConnectV2Connector';
import { useEffect } from 'react';

import { useMetamaskConnect } from 'components/_app/Web3ConnectionManager/hooks/useMetamaskConnect';
import ErrorComponent from 'components/common/errors/WalletError';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import type { AnyIdLogin } from 'components/login/LoginButton';
import { useUnstoppableDomains } from 'hooks/useUnstoppableDomains';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { DisabledAccountError } from 'lib/utilities/errors';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

import { ConnectorButton } from './components/ConnectorButton';
import processConnectionError from './utils/processConnectionError';

type AnyIdPostLoginHandler<I extends IdentityType = IdentityType> = (loginInfo: AnyIdLogin<I>) => any;

type Props = {
  loginSuccess: AnyIdPostLoginHandler<'UnstoppableDomain' | 'Wallet'>;
  onError?: (err: DisabledAccountError) => void;
};

export function WalletSelector({ loginSuccess, onError = () => null }: Props) {
  const {
    setActivatingConnector,
    closeWalletSelectorModal,
    openNetworkModal,
    isConnectingIdentity,
    activatingConnector
  } = useWeb3ConnectionManager();
  const { error } = useWeb3React();
  const { active, activate, connector, setError } = useWeb3React();
  const { uAuthPopupError, unstoppableDomainsLogin } = useUnstoppableDomains();

  const handleConnect = (_connector: AbstractConnector) => {
    setActivatingConnector(_connector);
    activate(_connector, undefined, true).catch((err) => {
      // eslint-disable-next-line no-console
      console.log('CONNECTION ERROR', { err });
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
    if (error instanceof UnsupportedChainIdError) {
      closeWalletSelectorModal();
      openNetworkModal();
    }
  }, [error, openNetworkModal, closeWalletSelectorModal]);

  const redirectUri = getCallbackDomain(typeof window === 'undefined' ? '' : window.location.hostname).toString();
  log.info('Connect redirectUri', redirectUri);

  async function handleUnstoppableDomainsLogin() {
    unstoppableDomainsLogin({ loginSuccess, onError });
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
            onClick={() => {
              WalletConnectV2Connector.clearStorage(window.localStorage);
              handleConnect(walletConnect);
            }}
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
export function WalletSelectorModal({ loginSuccess, onError }: Props) {
  const { isWalletSelectorModalOpen, closeWalletSelectorModal } = useWeb3ConnectionManager();
  return (
    <Modal open={isWalletSelectorModalOpen} onClose={closeWalletSelectorModal}>
      <WalletSelector loginSuccess={loginSuccess} onError={onError} />
    </Modal>
  );
}

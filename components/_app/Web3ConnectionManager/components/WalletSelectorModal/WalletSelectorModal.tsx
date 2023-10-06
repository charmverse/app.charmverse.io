import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma';
import ArrowSquareOut from '@mui/icons-material/Launch';
import { Grid, IconButton, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import { coinbaseWalletConnector, injectedConnector, walletConnectConnector } from 'connectors/config';
import { useEffect } from 'react';
import type { Connector } from 'wagmi';
import { useAccount, useConnect } from 'wagmi';

import { useMetamaskConnect } from 'components/_app/Web3ConnectionManager/hooks/useMetamaskConnect';
import { Button } from 'components/common/Button';
import ErrorComponent from 'components/common/errors/WalletError';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import type { AnyIdLogin } from 'components/login/components/LoginButton';
import { useUnstoppableDomains } from 'hooks/useUnstoppableDomains';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { DisabledAccountError } from 'lib/utilities/errors';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

import { ConnectorButton } from './components/ConnectorButton';
import processConnectionError from './utils/processConnectionError';

type AnyIdPostLoginHandler<I extends IdentityType = IdentityType> = (loginInfo: AnyIdLogin<I>) => any;

type Props = {
  loginSuccess?: AnyIdPostLoginHandler<'UnstoppableDomain' | 'Wallet'>;
  onError?: (err: DisabledAccountError) => void;
};

export function WalletSelector({ loginSuccess = () => null, onError = () => null }: Props) {
  const { closeWalletSelectorModal, isWalletSelectorModalOpen, isConnectingIdentity } = useWeb3ConnectionManager();
  const { uAuthPopupError, unstoppableDomainsLogin } = useUnstoppableDomains();
  const { pendingConnector, error, isLoading, connectAsync } = useConnect();
  const { connector: activeConnector, isConnected } = useAccount();

  useEffect(() => {
    // reset WalletConnect if user has changed connector
    if (activeConnector && activeConnector?.id !== walletConnectConnector.id) {
      walletConnectConnector.disconnect();
    }
  }, [activeConnector]);

  const handleConnect = async (_connector: Connector) => {
    try {
      await connectAsync({ connector: _connector });
    } catch (err) {
      log.warn('CONNECTION ERROR', { err });
    }
  };

  const { label, connectMetamask } = useMetamaskConnect(() => handleConnect(injectedConnector));

  // close the modal after signing in
  useEffect(() => {
    if (isConnected && isWalletSelectorModalOpen) {
      closeWalletSelectorModal();
    }
  }, [closeWalletSelectorModal, isConnected, isWalletSelectorModalOpen]);

  const redirectUri = getCallbackDomain(typeof window === 'undefined' ? '' : window.location.hostname).toString();
  log.info('Connect redirectUri', redirectUri);

  async function handleUnstoppableDomainsLogin() {
    unstoppableDomainsLogin({ loginSuccess, onError });
  }

  return (
    <div>
      <ErrorComponent error={error || undefined} processError={processConnectionError} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ConnectorButton
            name={label}
            onClick={connectMetamask}
            iconUrl='metamask.png'
            disabled={activeConnector?.id === injectedConnector.id || isLoading}
            isActive={activeConnector?.id === injectedConnector.id}
            isLoading={isLoading && pendingConnector?.id === injectedConnector.id}
          />
        </Grid>

        <Grid item xs={12}>
          <ConnectorButton
            name='WalletConnect'
            onClick={() => {
              handleConnect(walletConnectConnector);
            }}
            iconUrl='walletconnect.svg'
            disabled={activeConnector?.id === walletConnectConnector.id || isLoading}
            isActive={activeConnector?.id === walletConnectConnector.id}
            isLoading={isLoading && pendingConnector?.id === walletConnectConnector.id}
          />
        </Grid>
        <Grid item xs={12}>
          <ConnectorButton
            name='Coinbase Wallet'
            onClick={() => handleConnect(coinbaseWalletConnector)}
            iconUrl='coinbasewallet.png'
            disabled={activeConnector?.id === coinbaseWalletConnector.id || isLoading}
            isActive={activeConnector?.id === coinbaseWalletConnector.id}
            isLoading={isLoading && pendingConnector?.id === coinbaseWalletConnector.id}
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

export function WalletSelectorModal() {
  const { isWalletSelectorModalOpen, closeWalletSelectorModal } = useWeb3ConnectionManager();
  return (
    <Modal open={isWalletSelectorModalOpen} onClose={closeWalletSelectorModal}>
      <WalletSelector />
    </Modal>
  );
}

export function OpenWalletSelectorModal({ color }: { color?: string }) {
  const { connectWallet } = useWeb3ConnectionManager();
  return (
    <Button variant='outlined' onClick={connectWallet} color={color}>
      Connect Wallet
    </Button>
  );
}

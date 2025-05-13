import { log } from '@charmverse/core/log';
import ArrowSquareOut from '@mui/icons-material/Launch';
import { Grid, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Connector } from 'wagmi';

import { useMetamaskConnect } from 'components/_app/Web3ConnectionManager/hooks/useMetamaskConnect';
import ErrorComponent from 'components/common/errors/WalletError';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import { useAccount, useConnect } from 'hooks/wagmi';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

import { ConnectorButton } from './components/ConnectorButton';
import processConnectionError from './utils/processConnectionError';

export function WalletSelector() {
  const { closeWalletSelectorModal, isWalletSelectorModalOpen } = useWeb3ConnectionManager();
  const { error, connectAsync, connectors } = useConnect();
  const { connector: activeConnector, isConnected } = useAccount();
  const [isLoadingConnectorId, setLoadingConnectorId] = useState<string | null>(null);

  const coinbaseWalletConnector = connectors.find((c) => c.type === 'coinbaseWallet');
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');

  useEffect(() => {
    // reset WalletConnect if user has changed connector
    if (activeConnector && walletConnectConnector && activeConnector?.id !== walletConnectConnector?.id) {
      walletConnectConnector.disconnect();
    }
  }, [activeConnector, walletConnectConnector]);

  const handleConnect = async (_connector: Connector) => {
    try {
      setLoadingConnectorId(_connector.id);
      await connectAsync({ connector: _connector });
    } catch (err) {
      log.warn('Wallet connection error', { error: err });
    }
    setLoadingConnectorId(null);
  };

  const { label, connectMetamask } = useMetamaskConnect(() => injectedConnector && handleConnect(injectedConnector));

  // close the modal after signing in
  useEffect(() => {
    if (isConnected && isWalletSelectorModalOpen) {
      closeWalletSelectorModal();
    }
  }, [closeWalletSelectorModal, isConnected, isWalletSelectorModalOpen]);

  function isWalletConnected(connectorId?: string) {
    return !!(connectorId && activeConnector?.id === connectorId);
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
            disabled={isWalletConnected(injectedConnector?.id) || !!isLoadingConnectorId}
            isActive={isWalletConnected(injectedConnector?.id)}
            isLoading={!!isLoadingConnectorId && isLoadingConnectorId === injectedConnector?.id}
          />
        </Grid>

        <Grid item xs={12}>
          <ConnectorButton
            name='WalletConnect'
            onClick={() => {
              if (walletConnectConnector) {
                handleConnect(walletConnectConnector);
              } else {
                log.warn('WalletConnect connector not found');
              }
            }}
            iconUrl='walletconnect.svg'
            disabled={isWalletConnected(walletConnectConnector?.id) || !!isLoadingConnectorId}
            isActive={isWalletConnected(walletConnectConnector?.id)}
            isLoading={!!isLoadingConnectorId && isLoadingConnectorId === walletConnectConnector?.id}
          />
        </Grid>
        <Grid item xs={12}>
          <ConnectorButton
            name='Coinbase Wallet'
            onClick={() => {
              if (coinbaseWalletConnector) {
                handleConnect(coinbaseWalletConnector);
              } else {
                log.warn('Coinbase connector not found');
              }
            }}
            iconUrl='coinbasewallet.png'
            disabled={isWalletConnected(coinbaseWalletConnector?.id) || !!isLoadingConnectorId}
            isActive={isWalletConnected(coinbaseWalletConnector?.id)}
            isLoading={!!isLoadingConnectorId && isLoadingConnectorId === coinbaseWalletConnector?.id}
          />
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

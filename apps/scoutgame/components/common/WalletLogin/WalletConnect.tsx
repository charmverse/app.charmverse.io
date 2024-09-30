import WalletIcon from '@mui/icons-material/Wallet';
import { Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Connector } from 'wagmi';

import { BasicModal } from 'components/common/Modal';
import { useWallet } from 'hooks/useWallet'; // Import the custom hook
import '@rainbow-me/rainbowkit/styles.css';

export function WalletConnect({ onSuccess }: { onSuccess?: VoidFunction }) {
  const [open, setOpen] = useState(false);

  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);

  return (
    <>
      <Button onClick={onOpen} size='large' color='secondary'>
        Connect Wallet
      </Button>
      <BasicModal open={open} onClose={onClose}>
        <WalletConnectForm onConnect={onSuccess} />
      </BasicModal>
    </>
  );
}

export function WalletConnectForm({ onConnect }: { onConnect?: VoidFunction }) {
  const { connectors, connectWallet, connectError } = useWallet();

  const handleConnect = async (connector: Connector) => {
    await connectWallet(connector);
    if (onConnect) {
      onConnect(); // Only handle the wallet connection approval here
    }
  };

  const errorMessage = useMemo(() => {
    if (!connectError) {
      return null;
    }
    if (connectError.name === 'UserRejectedRequestError') {
      return 'User cancelled request';
    } else if (connectError.name === 'ResourceUnavailableRpcError') {
      return 'Could not connect to the network';
    } else if (connectError.name === 'ConnectorAlreadyConnectedError') {
      return 'Wallet already connected';
    } else if ((connectError.name as any) === 'ProviderNotFoundError') {
      return 'Could not detect wallet.';
    }
    return (connectError as any).shortMessage || connectError.message || 'Something went wrong. Please try again.';
  }, [connectError]);

  return (
    <>
      <Typography mb={2} textAlign='center' variant='h6'>
        Choose your wallet
      </Typography>
      <Stack gap={2}>
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => handleConnect(connector)}
            startIcon={
              connector.icon ? (
                <Image src={connector.icon} alt='' width={20} height={20} />
              ) : (
                <WalletIcon fontSize='small' />
              )
            }
          >
            {connector.name}
          </Button>
        ))}
        {errorMessage && (
          <Typography align='center' variant='caption' color='error'>
            {errorMessage}
          </Typography>
        )}
      </Stack>
    </>
  );
}

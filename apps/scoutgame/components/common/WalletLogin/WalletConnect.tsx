import WalletIcon from '@mui/icons-material/Wallet';
import { Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';
import type { Connector } from 'wagmi';

import { BasicModal } from 'components/common/Modal';
import { useWallet } from 'hooks/useWallet'; // Import the custom hook

export function WalletConnect({ onSuccess }: { onSuccess?: VoidFunction }) {
  const { connectors, connectWallet, connectError } = useWallet();
  const [open, setOpen] = useState(false);

  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);

  const handleConnect = async (connector: Connector) => {
    await connectWallet(connector);
    if (onSuccess) {
      onSuccess(); // Only handle the wallet connection approval here
    }
  };

  const errorWalletMessage = connectError?.message;

  return (
    <>
      <Button onClick={onOpen} size='large' color='secondary'>
        Connect Wallet
      </Button>
      <BasicModal open={open} onClose={onClose}>
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
                  <Image src={connector.icon} alt={`${connector.name} icon`} width={20} height={20} />
                ) : (
                  <WalletIcon fontSize='small' />
                )
              }
            >
              {connector.name}
            </Button>
          ))}
        </Stack>
      </BasicModal>
      {errorWalletMessage && <Typography color='error'>{errorWalletMessage}</Typography>}
    </>
  );
}

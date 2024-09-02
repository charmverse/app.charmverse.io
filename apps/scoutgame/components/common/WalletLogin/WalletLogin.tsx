'use client';

import { log } from '@charmverse/core/log';
import WalletIcon from '@mui/icons-material/Wallet';
import { Box, Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import type { Connector } from 'wagmi';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';

import { BasicModal } from 'components/common/Modal';
import { loginAction } from 'lib/auth/loginUserAction';

export function WalletLogin() {
  const [open, setOpen] = useState(false);
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);

  const router = useRouter();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();
  const {
    connectors,
    connectAsync,
    error: connectError
  } = useConnect({
    mutation: {
      onError(error) {
        log.error('Error connecting wallet', { error });
      }
    }
  });
  const { signMessageAsync, error: signMessageError } = useSignMessage({
    mutation: {
      onError(error) {
        log.error('Error on signing with wallet', { error });
      }
    }
  });
  const { executeAsync, result } = useAction(loginAction);

  const handleWalletConnect = async (connector: Connector) => {
    try {
      if (isConnected) {
        await disconnectAsync();
      }

      const accountData = await connectAsync({ connector });
      const accountAddress = accountData.accounts.at(0);
      const chainId = accountData.chainId;

      if (!accountAddress) {
        log.error('No account address found');
        return;
      }

      const preparedMessage: Partial<SiweMessage> = {
        domain: window.location.host,
        address: getAddress(accountAddress), // convert to EIP-55 format or else SIWE complains
        uri: window.location.origin,
        version: '1',
        chainId: chainId ?? 1
      };

      const siweMessage = new SiweMessage(preparedMessage);
      const message = siweMessage.prepareMessage();
      const signature = await signMessageAsync({ message });
      return { message, signature };
    } catch (error) {
      // handle error outside
    }
  };
  const handleWalletLogin = async (connector: Connector) => {
    const data = await handleWalletConnect(connector);
    if (!data) {
      return;
    }

    const { message, signature } = data;
    await executeAsync({ type: 'wallet', wallet: { message, signature } });
    router.refresh();
  };

  const errorWalletMessage = signMessageError?.message || connectError?.message;

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <Button
        onClick={onOpen}
        size='large'
        color='secondary'
        sx={(theme) => ({
          maxWidth: '400px',
          width: '100%',
          fontSize: theme.typography.h6.fontSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          mx: 'auto'
        })}
      >
        Sign in with a wallet
      </Button>
      <BasicModal open={open} onClose={onClose} aria-labelledby='modal-title'>
        <Typography mb={2} textAlign='center' id='modal-modal-title' variant='h6' component='h2'>
          Choose your wallet
        </Typography>
        <Stack gap={2}>
          {connectors
            .filter((connector, _i, arr) => (arr.length > 1 ? connector.id !== 'injected' : true))
            .map((connector) => (
              <Button
                key={connector.uid}
                size='large'
                onClick={() => handleWalletLogin(connector)}
                startIcon={
                  connector.icon ? (
                    <Image src={connector.icon} alt={`${connector.icon} icon`} width={20} height={20} />
                  ) : (
                    <WalletIcon fontSize='small' />
                  )
                }
                sx={{ p: 1 }}
              >
                {connector.name}
              </Button>
            ))}
        </Stack>
      </BasicModal>
      {errorWalletMessage && (
        <Typography variant='body2'>
          {errorWalletMessage || 'There was an error while logging in with your wallet'}
        </Typography>
      )}
    </Box>
  );
}

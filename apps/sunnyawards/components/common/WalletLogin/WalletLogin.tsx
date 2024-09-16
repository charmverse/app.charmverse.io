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

import { Modal } from 'components/common/Modal/Modal';
import { loginWithWalletAction } from 'lib/session/loginWithWalletAction';

export function WalletLogin({ successPath }: { successPath: string }) {
  const [open, setOpen] = useState(false);

  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

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
  const { executeAsync, result, isExecuting } = useAction(loginWithWalletAction, {
    onSuccess: async () => {
      log.info('Successfully signed in with wallet');
      await router.push(successPath);
    },
    onError: (error) => {
      log.error('Error signing in with wallet', { error });
    }
  });

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
      return { message, signature, address: accountAddress };
    } catch (error) {
      // handle error outside
    }
  };
  const handleWalletLogin = async (connector: Connector) => {
    setIsConnectingWallet(true);
    const data = await handleWalletConnect(connector);
    if (!data) {
      setIsConnectingWallet(false);
      return;
    }
    await executeAsync(data);
    setIsConnectingWallet(false);
  };

  const errorWalletMessage =
    signMessageError?.message || connectError?.message || result.validationErrors?.fieldErrors.message;

  return (
    <Box data-test='connect-with-wallet'>
      <Button
        onClick={onOpen}
        size='large'
        color='secondary'
        sx={(theme) => ({
          width: '250px',
          fontSize: theme.typography.h6.fontSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto'
        })}
      >
        Sign in with a wallet
      </Button>
      <Modal open={open} onClose={onClose} aria-labelledby='modal-title'>
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
                disabled={isConnectingWallet || isExecuting}
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
      </Modal>
      {errorWalletMessage && (
        <Typography variant='body2' color='error' sx={{ mt: 2 }}>
          {errorWalletMessage || 'There was an error while logging in with your wallet'}
        </Typography>
      )}
    </Box>
  );
}

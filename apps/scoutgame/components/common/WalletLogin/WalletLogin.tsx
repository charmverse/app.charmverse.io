'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import { useSignMessage, useAccount } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

import { useUser } from 'components/layout/UserProvider';
import { loginWithWalletAction } from 'lib/session/loginWithWalletAction';

export function WalletLogin() {
  return (
    <RainbowKitProvider>
      <WalletLoginButton />
    </RainbowKitProvider>
  );
}

function WalletLoginButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { address, chainId, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const redirectUrlEncoded = searchParams.get('redirectUrl');
  const inviteCode = searchParams.get('invite-code');
  const redirectUrl = redirectUrlEncoded ? decodeURIComponent(redirectUrlEncoded) : '/';
  const { refreshUser } = useUser();
  const router = useRouter();
  const { signMessageAsync, error: signMessageError } = useSignMessage({
    mutation: {
      onError(error) {
        log.error('Error on signing with wallet', { error });
      }
    }
  });

  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);

  const { executeAsync, result, isExecuting } = useAction(loginWithWalletAction, {
    onSuccess: async ({ data }) => {
      const nextPage = !data?.onboarded ? '/welcome' : inviteCode ? '/welcome/builder' : redirectUrl || '/home';

      if (!data?.success) {
        return;
      }

      await refreshUser(data.user);

      await revalidatePath();
      router.push(nextPage);
    }
  });

  const errorWalletMessage = signMessageError?.message || result.validationErrors?.fieldErrors.message;

  const handleWalletConnect = async (_address: string) => {
    const preparedMessage: Partial<SiweMessage> = {
      domain: window.location.host,
      address: getAddress(_address),
      uri: window.location.origin,
      version: '1',
      chainId: chainId ?? 1
    };

    const siweMessage = new SiweMessage(preparedMessage);
    const message = siweMessage.prepareMessage();
    const signature = await signMessageAsync({ message });
    executeAsync({ message, signature });
  };

  useEffect(() => {
    if (address && isConnected && isConnecting) {
      handleWalletConnect(address).finally(() => {
        setIsConnecting(false);
      });
    }
  }, [address, isConnected, isConnecting]);

  return (
    <Box width='100%'>
      {errorWalletMessage && (
        <Typography variant='body2' color='error' sx={{ mb: 2 }}>
          {errorWalletMessage || 'There was an error while logging in with your wallet'}
        </Typography>
      )}
      <LoadingButton
        loading={isExecuting}
        size='large'
        variant='contained'
        sx={{
          minWidth: '250px',
          px: 2.5,
          py: 1.5
        }}
      >
        <Stack direction='row' alignItems='center' gap={1} justifyContent='flex-start' width='100%'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography
            fontWeight={600}
            color='white'
            onClick={() => {
              openConnectModal?.();
              setIsConnecting(true);
            }}
          >
            Sign in with wallet
          </Typography>
        </Stack>
      </LoadingButton>
    </Box>
  );
}

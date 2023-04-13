import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { AuthSig } from 'lit-js-sdk';

import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { shortenHex } from 'lib/utilities/strings';

type Props = {
  isConnectingWallet: boolean;
  onSignSuccess: (authSig: AuthSig) => void;
};

export function AddWalletStep({ isConnectingWallet, onSignSuccess }: Props) {
  const { account } = useWeb3AuthSig();

  const { user } = useUser();
  const currentWallets = user?.wallets || [];
  const isWalletConnected = !!account && !!currentWallets.find((w) => w.address === account);

  return (
    <Stack gap={2}>
      <Typography>
        To add another wallet to your account, switch to the wallet you want to add. You will be asked to connect and
        sign a message.
      </Typography>

      <Stack direction={['column', 'row']} gap={1} alignItems='center'>
        <Stack width='100%'>
          <Typography variant='subtitle2'>Current address</Typography>
          <Typography color='subtitle1' noWrap>
            {account}
          </Typography>
        </Stack>

        <Stack flex={1} alignItems='flex-end'>
          {isWalletConnected ? (
            <PrimaryButton size='small' disabled>
              Connected
            </PrimaryButton>
          ) : (
            <WalletSign
              buttonSize='small'
              signSuccess={onSignSuccess}
              loading={isConnectingWallet}
              enableAutosign={false}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

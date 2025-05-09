import { Typography, Stack } from '@mui/material';

import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login/components/WalletSign';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';

type Props = {
  isConnectingWallet: boolean;
  onSignSuccess: (payload: SignatureVerificationPayload) => Promise<void>;
};

export function AddWalletStep({ isConnectingWallet, onSignSuccess }: Props) {
  const { account } = useWeb3Account();

  const { user } = useUser();
  const currentWallets = user?.wallets || [];
  const isWalletConnected = !!account && !!currentWallets.find((w) => w.address === account);

  return (
    <Stack gap={2}>
      <Typography>
        To add another wallet to your account, switch to the wallet you want to add. You will be asked to connect and
        sign a message.
      </Typography>
      {!isWalletConnected && (
        <Typography>
          <i>Click verify wallet to add your new wallet or change back to an authorised account to close the window.</i>
        </Typography>
      )}

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

import { Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import { useUser } from 'hooks/useUser';

import { useRequiredMemberProperties } from '../hooks/useRequiredMemberProperties';

function ConnectedAccount({
  icon,
  account,
  required
}: {
  required: boolean;
  account: 'discord' | 'google' | 'telegram' | 'wallet';
  icon: ReactNode;
}) {
  return (
    <Stack gap={1} width={225}>
      <FieldWrapper label={account[0].toUpperCase() + account.slice(1).toLocaleLowerCase()} required={required}>
        <Button color='secondary' variant='outlined'>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%'>
            <Typography variant='subtitle1'>
              Connect with {account[0].toUpperCase() + account.slice(1).toLocaleLowerCase()}
            </Typography>
            {icon}
          </Stack>
        </Button>
      </FieldWrapper>
    </Stack>
  );
}

export function ConnectedAccounts({ userId }: { userId: string }) {
  const { user } = useUser();
  const hasConnectedWallet = user?.wallets.length !== 0;
  const { isGoogleRequired, isDiscordRequired, isWalletRequired, isTelegramRequired } = useRequiredMemberProperties({
    userId
  });
  return (
    <Stack gap={1}>
      <ConnectedAccount
        account='discord'
        icon={<IdentityIcon type='Discord' height={22} width={22} />}
        required={isDiscordRequired}
      />
      <ConnectedAccount
        account='google'
        icon={<IdentityIcon type='Google' height={22} width={22} />}
        required={isGoogleRequired}
      />
      <ConnectedAccount
        account='telegram'
        icon={<IdentityIcon type='Telegram' height={25} width={25} />}
        required={isTelegramRequired}
      />
      <ConnectedAccount
        account='wallet'
        icon={<IdentityIcon type='Wallet' height={25} width={25} />}
        required={isWalletRequired}
      />
    </Stack>
  );
}

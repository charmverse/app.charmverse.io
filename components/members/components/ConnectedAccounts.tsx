import { Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import { useUser } from 'hooks/useUser';
import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import { shortenHex } from 'lib/utilities/blockchain';
import type { TelegramAccount } from 'pages/api/telegram/connect';

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
  const { user } = useUser();
  const connectedWallet = user?.wallets?.[0];
  const connectedGoogleAccount = user?.googleAccounts?.[0];
  const connectedDiscordAccount = user?.discordUser;
  const connectedTelegramAccount = user?.telegramUser;

  let isDisabled = false;
  let content = (
    <Typography variant='subtitle1'>
      Connect with {account[0].toUpperCase() + account.slice(1).toLocaleLowerCase()}
    </Typography>
  );

  if (account === 'wallet' && connectedWallet) {
    content = <Typography variant='subtitle1'>Connected as {shortenHex(user?.wallets[0].address)}</Typography>;
    isDisabled = true;
  } else if (account === 'google' && connectedGoogleAccount) {
    content = <Typography variant='subtitle1'>Connected as {connectedGoogleAccount.name}</Typography>;
    isDisabled = true;
  } else if (account === 'discord' && connectedDiscordAccount) {
    content = (
      <Typography variant='subtitle1'>
        Connected as {(connectedDiscordAccount.account as unknown as DiscordAccount)?.discriminator}
      </Typography>
    );
    isDisabled = true;
  } else if (account === 'telegram' && connectedTelegramAccount) {
    content = (
      <Typography variant='subtitle1'>
        Connected as {(connectedTelegramAccount.account as unknown as Partial<TelegramAccount>)?.username}
      </Typography>
    );
    isDisabled = true;
  }

  return (
    <Stack gap={1} width={275}>
      <FieldWrapper label={account[0].toUpperCase() + account.slice(1).toLocaleLowerCase()} required={required}>
        <Button color='secondary' variant='outlined' disabled={isDisabled}>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%'>
            {content}
            {icon}
          </Stack>
        </Button>
      </FieldWrapper>
    </Stack>
  );
}

export function ConnectedAccounts({ userId }: { userId: string }) {
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

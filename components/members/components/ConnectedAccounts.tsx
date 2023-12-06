import styled from '@emotion/styled';
import { Stack, SvgIcon, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

import { useRequiredMemberProperties } from '../hooks/useRequiredMemberProperties';

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

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
        required={isGoogleRequired}
      />
      <ConnectedAccount
        account='wallet'
        icon={<IdentityIcon type='Wallet' height={25} width={25} />}
        required={isWalletRequired}
      />
    </Stack>
  );
}

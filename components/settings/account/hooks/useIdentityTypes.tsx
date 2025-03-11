import type { StatusAPIResponse as FarcasterAccount } from '@farcaster/auth-kit';
import { matchWalletAddress, shortWalletAddress } from '@packages/utils/blockchain';
import { randomName } from '@packages/utils/randomName';
import { useMemo } from 'react';

import type { IdentityIconSize } from 'components/settings/profile/components/IdentityIcon';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import type { IntegrationModel } from 'components/settings/profile/components/IdentityModal';
import { useUser } from 'hooks/useUser';
import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import type { TelegramAccount } from 'lib/telegram/interfaces';

import { useLensProfile } from './useLensProfile';

export function useIdentityTypes(
  {
    size = 'medium'
  }: {
    size?: IdentityIconSize | number;
  } = {
    size: 'medium'
  }
) {
  const { user } = useUser();
  const { lensProfile } = useLensProfile();

  const identityTypes: IntegrationModel[] = useMemo(() => {
    if (!user) {
      return [];
    }

    const types: IntegrationModel[] = [];

    user.wallets?.forEach((wallet) => {
      const address = shortWalletAddress(wallet.address);

      types.push({
        type: 'Wallet',
        username: wallet.ensname ?? address,
        secondaryUserName: address,
        isInUse: user.identityType === 'Wallet' && matchWalletAddress(user.username, wallet),
        icon: <IdentityIcon size={size} type='Wallet' />
      });
    });

    if (user.discordUser?.account) {
      const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
      types.push({
        type: 'Discord',
        username: discordAccount.username || '',
        secondaryUserName: `${discordAccount.username} #${discordAccount.discriminator}`,
        isInUse: user.identityType === 'Discord',
        icon: <IdentityIcon size={size} type='Discord' />
      });
    }

    if (user.telegramUser?.account) {
      const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
      types.push({
        type: 'Telegram',
        username: telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`,
        isInUse: user.identityType === 'Telegram',
        icon: <IdentityIcon size={size} type='Telegram' />
      });
    }

    user?.googleAccounts?.forEach((acc) => {
      types.push({
        type: 'Google',
        username: acc.name,
        secondaryUserName: acc.email,
        isInUse: user.identityType === 'Google' && user.username === acc.name,
        icon: <IdentityIcon size={size} type='Google' />
      });
    });

    user.verifiedEmails.forEach((verifiedEmail) => {
      types.push({
        type: 'VerifiedEmail',
        username: verifiedEmail.email,
        isInUse:
          user.identityType === 'VerifiedEmail' && [verifiedEmail.email, verifiedEmail.name].includes(user.username),
        icon: <IdentityIcon size={size} type='VerifiedEmail' />
      });
    });

    if (lensProfile) {
      types.push({
        type: 'Lens',
        username: lensProfile.metadata?.displayName ?? (lensProfile.handle?.fullHandle ?? '').split('/')[1] ?? '',
        isInUse: user.identityType === 'Lens',
        icon: <IdentityIcon size={size} type='Lens' />
      });
    }

    if (user.farcasterUser?.account) {
      const farcasterAccount = user.farcasterUser.account as Partial<FarcasterAccount>;
      types.push({
        type: 'Farcaster',
        username: farcasterAccount.username ?? '',
        isInUse: user.identityType === 'Farcaster',
        icon: <IdentityIcon size={size} type='Farcaster' />
      });
    }

    types.push({
      type: 'RandomName',
      username: user.identityType === 'RandomName' && user.username ? user.username : randomName(),
      isInUse: user.identityType === 'RandomName',
      icon: <IdentityIcon size={size} type='RandomName' />
    });

    return types;
  }, [user, lensProfile, size]);

  return identityTypes;
}

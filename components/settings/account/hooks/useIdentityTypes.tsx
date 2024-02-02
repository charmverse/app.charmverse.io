import { useMemo } from 'react';

import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import type { IntegrationModel } from 'components/settings/profile/components/IdentityModal';
import { useFarcasterProfile } from 'hooks/useFarcasterProfile';
import { useUser } from 'hooks/useUser';
import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import { matchWalletAddress, shortWalletAddress } from 'lib/utilities/blockchain';
import randomName from 'lib/utilities/randomName';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { useLensProfile } from './useLensProfile';

export function useIdentityTypes() {
  const { user } = useUser();
  const { lensProfile } = useLensProfile();
  const { farcasterProfile } = useFarcasterProfile();

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
        icon: <IdentityIcon type='Wallet' />
      });
    });

    if (user.discordUser?.account) {
      const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
      types.push({
        type: 'Discord',
        username: discordAccount.username || '',
        secondaryUserName: `${discordAccount.username} #${discordAccount.discriminator}`,
        isInUse: user.identityType === 'Discord',
        icon: <IdentityIcon type='Discord' />
      });
    }

    if (user.telegramUser?.account) {
      const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
      types.push({
        type: 'Telegram',
        username: telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`,
        isInUse: user.identityType === 'Telegram',
        icon: <IdentityIcon type='Telegram' />
      });
    }

    user?.googleAccounts?.forEach((acc) => {
      types.push({
        type: 'Google',
        username: acc.name,
        secondaryUserName: acc.email,
        isInUse: user.identityType === 'Google' && user.username === acc.name,
        icon: <IdentityIcon type='Google' />
      });
    });

    user.verifiedEmails.forEach((verifiedEmail) => {
      types.push({
        type: 'VerifiedEmail',
        username: verifiedEmail.email,
        isInUse:
          user.identityType === 'VerifiedEmail' && [verifiedEmail.email, verifiedEmail.name].includes(user.username),
        icon: <IdentityIcon type='VerifiedEmail' />
      });
    });

    if (lensProfile) {
      types.push({
        type: 'Lens',
        username: lensProfile.metadata?.displayName ?? (lensProfile.handle?.fullHandle ?? '').split('/')[1] ?? '',
        isInUse: user.identityType === 'Lens',
        icon: <IdentityIcon type='Lens' />
      });
    }

    if (farcasterProfile) {
      types.push({
        type: 'Farcaster',
        username: farcasterProfile.body.username ?? '',
        isInUse: user.identityType === 'Farcaster',
        icon: <IdentityIcon type='Farcaster' />
      });
    }

    types.push({
      type: 'RandomName',
      username: user.identityType === 'RandomName' && user.username ? user.username : randomName(),
      isInUse: user.identityType === 'RandomName',
      icon: <IdentityIcon type='RandomName' />
    });

    return types;
  }, [user, lensProfile, farcasterProfile]);

  return identityTypes;
}

import { useMemo } from 'react';

import type { IntegrationModel } from 'components/profile/components';
import { IdentityIcon } from 'components/profile/components/IdentityIcon';
import { useUser } from 'hooks/useUser';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import randomName from 'lib/utilities/randomName';
import { matchWalletAddress, shortWalletAddress } from 'lib/utilities/strings';
import type { TelegramAccount } from 'pages/api/telegram/connect';

export function useIdentityTypes() {
  const { user } = useUser();

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

    user.unstoppableDomains?.forEach(({ domain }) => {
      types.push({
        type: 'UnstoppableDomain',
        username: domain,
        isInUse: user.identityType === 'UnstoppableDomain' && user.username === domain,
        icon: <IdentityIcon type='UnstoppableDomain' />
      });
    });

    user.verifiedEmails.forEach((verifiedEmail) => {
      types.push({
        type: 'VerifiedEmail',
        username: verifiedEmail.name ?? verifiedEmail.email,
        isInUse:
          user.identityType === 'VerifiedEmail' && [verifiedEmail.email, verifiedEmail.name].includes(user.username),
        icon: <IdentityIcon type='VerifiedEmail' />
      });
    });

    types.push({
      type: 'RandomName',
      username: user.identityType === 'RandomName' && user.username ? user.username : randomName(),
      isInUse: user.identityType === 'RandomName',
      icon: <IdentityIcon type='RandomName' />
    });

    return types;
  }, [user]);

  return identityTypes;
}

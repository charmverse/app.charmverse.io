import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { defaultProjectValues } from './constants';
import type { ProjectValues } from './interfaces';

export function getDefaultProjectValues({
  membersRecord,
  user
}: {
  user: LoggedInUser | null;
  membersRecord: Record<string, Member>;
}): ProjectValues {
  const currentMember = user ? membersRecord[user.id] : null;
  const primaryWallet = user?.wallets.find((wallet) => wallet.id === user?.primaryWalletId) ?? user?.wallets[0];
  const userEmail =
    user?.email ?? ((user?.verifiedEmails.length ? user.verifiedEmails[0].email : undefined) as string | undefined);
  const telegramUsername = (user?.telegramUser?.account as unknown as Partial<TelegramAccount>)?.username;

  return {
    ...defaultProjectValues,
    projectMembers: [
      {
        ...defaultProjectValues.projectMembers[0],
        email: userEmail ?? '',
        twitter: currentMember?.profile?.social?.twitterURL ?? '',
        telegram: telegramUsername ?? '',
        linkedin: currentMember?.profile?.social?.linkedinURL ?? '',
        github: currentMember?.profile?.social?.githubURL ?? '',
        walletAddress: primaryWallet?.ensname ?? primaryWallet?.address ?? ''
      }
    ]
  };
}

import type { LoggedInUser } from '@root/models';

import type { Member } from 'lib/members/interfaces';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { createDefaultProject, defaultProjectMember } from './constants';
import type { ProjectAndMembersPayload } from './interfaces';

export function getDefaultProjectValues({
  userMemberRecord,
  user
}: {
  user: LoggedInUser | null;
  userMemberRecord?: Member;
}): ProjectAndMembersPayload {
  const primaryWallet = user?.wallets.find((wallet) => wallet.id === user?.primaryWalletId) ?? user?.wallets[0];
  const userEmail =
    user?.email ?? ((user?.verifiedEmails.length ? user.verifiedEmails[0].email : undefined) as string | undefined);
  const telegramUsername = (user?.telegramUser?.account as unknown as Partial<TelegramAccount>)?.username;

  return {
    ...createDefaultProject(),
    projectMembers: [
      defaultProjectMember({
        email: userEmail ?? '',
        github: userMemberRecord?.profile?.social?.githubURL ?? '',
        linkedin: userMemberRecord?.profile?.social?.linkedinURL ?? '',
        teamLead: true,
        telegram: telegramUsername ?? '',
        twitter: userMemberRecord?.profile?.social?.twitterURL ?? '',
        walletAddress: primaryWallet?.ensname ?? primaryWallet?.address ?? ''
      })
    ]
  };
}

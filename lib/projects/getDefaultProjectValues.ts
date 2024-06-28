import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { createDefaultProjectAndMembersPayload } from './constants';
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
  const defaultProjectAndMembersPayload = createDefaultProjectAndMembersPayload();

  return {
    ...defaultProjectAndMembersPayload,
    projectMembers: [
      {
        ...defaultProjectAndMembersPayload.projectMembers[0],
        email: userEmail ?? '',
        twitter: userMemberRecord?.profile?.social?.twitterURL ?? '',
        telegram: telegramUsername ?? '',
        linkedin: userMemberRecord?.profile?.social?.linkedinURL ?? '',
        github: userMemberRecord?.profile?.social?.githubURL ?? '',
        walletAddress: primaryWallet?.ensname ?? primaryWallet?.address ?? ''
      }
    ]
  };
}

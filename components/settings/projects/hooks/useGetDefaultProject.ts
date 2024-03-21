import { projectDefaultValues } from 'components/projects/ProjectFields';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { TelegramAccount } from 'pages/api/telegram/connect';

export function useGetDefaultProject() {
  const { user } = useUser();
  const { membersRecord } = useMembers();

  const currentMember = membersRecord[user!.id];
  const primaryWallet = user?.wallets.find((wallet) => wallet.id === user?.primaryWalletId) ?? user?.wallets[0];
  const userEmail =
    user?.email ?? ((user?.verifiedEmails.length ? user.verifiedEmails[0].email : undefined) as string | undefined);
  const telegramUsername = (user?.telegramUser?.account as unknown as Partial<TelegramAccount>)?.username;

  return {
    ...projectDefaultValues,
    projectMembers: [
      {
        ...projectMemberDefaultValues,
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

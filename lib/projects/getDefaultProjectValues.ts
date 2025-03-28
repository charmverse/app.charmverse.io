import type { LoggedInUser } from '@packages/profile/getUser';
import type { Member } from '@root/lib/members/interfaces';

import { createDefaultProject, defaultProjectMember } from './constants';
import type { ProjectAndMembersPayload } from './interfaces';

export function getDefaultProjectValues({ user }: { user: LoggedInUser | null }): ProjectAndMembersPayload {
  const primaryWallet = user?.wallets.find((wallet) => wallet.id === user?.primaryWalletId) ?? user?.wallets[0];
  const userEmail =
    user?.email ?? ((user?.verifiedEmails.length ? user.verifiedEmails[0].email : undefined) as string | undefined);

  return {
    ...createDefaultProject(),
    projectMembers: [
      defaultProjectMember({
        email: userEmail ?? '',
        teamLead: true,
        walletAddress: primaryWallet?.ensname ?? primaryWallet?.address ?? ''
      })
    ]
  };
}

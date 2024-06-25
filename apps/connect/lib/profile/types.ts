import type {
  DiscordUser,
  FarcasterUser,
  GoogleAccount,
  Role as RoleMembership,
  SpaceRoleToRole,
  TelegramUser,
  User,
  UserNotificationState,
  UserWallet,
  VerifiedEmail
} from '@charmverse/core/prisma';

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  wallets: Pick<UserWallet, 'address' | 'ensname' | 'id'>[];
  farcasterUser?: FarcasterUser | null;
}

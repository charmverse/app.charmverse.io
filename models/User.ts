import type {
  DiscordUser,
  FarcasterUser,
  GoogleAccount,
  Role as RoleMembership,
  SpaceRole,
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
  favorites: { pageId: string; index?: number }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: Pick<UserWallet, 'address' | 'ensname' | 'id'>[];
  googleAccounts: Pick<GoogleAccount, 'email' | 'name'>[];
  verifiedEmails: Pick<VerifiedEmail, 'email' | 'name'>[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  farcasterUser?: FarcasterUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
  otp?: {
    activatedAt: Date | null;
  } | null;
  profile?: {
    timezone?: string | null;
    locale?: string | null;
  } | null;
}

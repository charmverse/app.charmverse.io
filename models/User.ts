import type {
  DiscordUser,
  GoogleAccount,
  Role as RoleMembership,
  SpaceRole,
  SpaceRoleToRole,
  TelegramUser,
  UnstoppableDomain,
  User,
  UserNotificationState,
  UserWallet,
  VerifiedEmail
} from '@charmverse/core/dist/prisma';

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  favorites: { pageId: string; index?: number }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: Pick<UserWallet, 'address' | 'ensname' | 'id'>[];
  unstoppableDomains: Pick<UnstoppableDomain, 'domain'>[];
  googleAccounts: Pick<GoogleAccount, 'email' | 'name'>[];
  verifiedEmails: Pick<VerifiedEmail, 'email' | 'name'>[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
  profile?: {
    timezone?: string | null;
    locale?: string | null;
  } | null;
}

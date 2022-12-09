import type {
  DiscordUser,
  Role as RoleMembership,
  SpaceRole,
  SpaceRoleToRole,
  TelegramUser,
  UnstoppableDomain,
  User,
  UserNotificationState
} from '@prisma/client';

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  favorites: { pageId: string }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: { address: string }[];
  unstoppableDomains: Pick<UnstoppableDomain, 'domain'>[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
}

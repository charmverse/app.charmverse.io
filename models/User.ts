import type { DiscordUser, FavoritePage, SpaceRole, User, Role as RoleMembership, SpaceRoleToRole } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export type Role = 'admin' | 'contributor';

export interface Contributor extends User {
  role: Role;
}

interface INestedMemberships {
  spaceRoleToRole: Array<SpaceRoleToRole & {role: RoleMembership}>
}

export interface LoggedInUser extends User {
  favorites: FavoritePage[];
  spaceRoles: (SpaceRole & INestedMemberships) []
  ensName?: string;
  discordUser?: DiscordUser | null

}

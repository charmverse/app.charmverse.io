import type { LoggedInUser } from '@packages/profile/getUser';

export default function isSpaceAdmin(user?: LoggedInUser | null, spaceId?: string): boolean {
  return !!spaceId && !!user && user.spaceRoles.some((role) => role.isAdmin === true && role.spaceId === spaceId);
}

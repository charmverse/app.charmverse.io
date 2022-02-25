import { LoggedInUser } from 'models/User';

export default function isSpaceAdmin (user?: LoggedInUser | null, spaceId?: string): boolean {
  return !!spaceId && !!user && user.spaceRoles.some(role => role.role === 'admin' && role.spaceId === spaceId);
}

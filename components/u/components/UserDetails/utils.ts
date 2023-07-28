import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export type PublicUserFields = { id: string };

export const isPublicUser = (user: PublicUserFields, currentUser: null | LoggedInUser): user is PublicUser => {
  if (user.id !== currentUser?.id) {
    return true;
  }
  return false;
};

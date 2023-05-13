import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export type PublicUserFields = Partial<Pick<PublicUser, 'id' | 'visibleNfts' | 'visiblePoaps'>>;

export const isPublicUser = (user: PublicUserFields, currentUser: null | LoggedInUser): user is PublicUser => {
  if (user.id !== currentUser?.id) {
    return true;
  }
  return false;
};

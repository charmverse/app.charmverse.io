import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export const isPublicUser = (user: PublicUser | LoggedInUser, currentUser: null | LoggedInUser): user is PublicUser => {
  if (user.id !== currentUser?.id && 'visibleNfts' in user && 'visiblePoaps' in user) {
    return true;
  }
  return false;
};

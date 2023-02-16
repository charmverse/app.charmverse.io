import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export const isPublicUser = (user: PublicUser | LoggedInUser, currentUser: null | LoggedInUser): user is PublicUser =>
  user.id !== currentUser?.id;

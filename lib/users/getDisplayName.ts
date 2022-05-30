import { LoggedInUser, User } from 'models/User';
import { shortenHex } from 'lib/utilities/strings';
import { PublicUser } from 'pages/api/public/profile/[userPath]/index';

export function getDisplayName (user?: User | LoggedInUser | PublicUser) {
  if (!user) return '';

  return (user as LoggedInUser).ensName
    || user.username
    || ((user as User).addresses && shortenHex((user as User).addresses[0]));
}

export default getDisplayName;

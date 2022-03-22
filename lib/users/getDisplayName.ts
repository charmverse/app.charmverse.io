import { LoggedInUser, User } from 'models/User';
import { shortenHex } from 'lib/utilities/strings';

export function getDisplayName (user?: User | LoggedInUser) {
  if (!user) return '';
  return (<LoggedInUser> user).ensName || user.username || shortenHex(user.addresses[0]);
}

export default getDisplayName;

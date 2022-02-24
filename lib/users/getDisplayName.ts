import { LoggedInUser, User } from 'models/User';
import { shortenHex } from 'lib/utilities/strings';

export function getDisplayName (user: User | LoggedInUser) {
  return (<LoggedInUser> user).ensName || shortenHex(user.addresses[0]);
}

export default getDisplayName;

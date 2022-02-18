import { User } from 'models/User';
import { shortenHex } from 'lib/strings';

export function getDisplayName (user: User) {
  return shortenHex(user.addresses[0]);
}

export default getDisplayName;

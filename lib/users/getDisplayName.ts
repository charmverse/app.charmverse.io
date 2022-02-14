import { User } from 'models/User';
import { shortenHex } from 'lib/strings';

export default function getDisplayName (user: User) {
  return shortenHex(user.addresses[0]);
}

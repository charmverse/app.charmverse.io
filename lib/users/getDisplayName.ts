import { DiscordUser, LoggedInUser, User } from 'models/User';
import { shortenHex } from 'lib/utilities/strings';

export function getDisplayName (user?: User | LoggedInUser, showDiscriminator?: boolean) {
  const discordData = user?.discord as unknown as DiscordUser;
  showDiscriminator = showDiscriminator ?? false;
  if (!user) return '';
  return (<LoggedInUser> user).ensName || discordData ? `${discordData.username}${showDiscriminator ? `#${discordData.discriminator}` : ''}` : shortenHex(user.addresses[0]);
}

export default getDisplayName;

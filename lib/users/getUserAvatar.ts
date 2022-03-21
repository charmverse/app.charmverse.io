import { DiscordUser, LoggedInUser, User } from 'models/User';

export function getUserAvatar (user?: User | LoggedInUser | null) {
  const discordData = user?.discord as unknown as DiscordUser;
  return discordData?.avatar ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png` : null;
}

export default getUserAvatar;

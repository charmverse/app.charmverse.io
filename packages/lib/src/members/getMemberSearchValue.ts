import type { DiscordUser, MemberPropertyValue, TelegramUser, User, UserDetails } from '@charmverse/core/prisma';

type UserData = User & {
  memberPropertyValues: MemberPropertyValue[];
  profile: UserDetails | null;
  telegramUser: TelegramUser | null;
  discordUser: DiscordUser | null;
};

export function getMemberSearchValue(
  userData: UserData,
  memberProperties: Record<string, string>,
  username: string
): string {
  const { profile, memberPropertyValues = [], telegramUser, discordUser } = userData;

  const discordAccountString =
    discordUser?.account && typeof discordUser?.account === 'object' && 'username' in discordUser.account
      ? discordUser?.account?.username
      : '';
  const telegramAccountString =
    telegramUser?.account && typeof telegramUser?.account === 'object' && 'username' in telegramUser.account
      ? telegramUser?.account?.username
      : '';

  const userDetailsString = `${userData.username} ${userData.path}`;

  // all property values
  const propertyValuesString = memberPropertyValues
    .map((prop) => {
      if (Array.isArray(prop.value)) {
        return prop.value.map((val) => memberProperties[val as string] || val).join(' ');
      }
      return memberProperties[prop.value as string] || prop.value;
    })
    .join(' ');

  // all socials
  const socialsString = profile?.social ? Object.values(profile.social).join(' ') : '';

  return `${userDetailsString} ${propertyValuesString} ${socialsString} ${telegramAccountString} ${discordAccountString} ${username}`
    .toLowerCase()
    .replace(/\s\s+/g, ' ');
}

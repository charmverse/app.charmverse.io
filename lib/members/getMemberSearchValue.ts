import type { DiscordUser, MemberPropertyValue, TelegramUser, User, UserDetails, UserWallet } from '@prisma/client';

type UserData = User & {
  memberPropertyValues: MemberPropertyValue[];
  profile: UserDetails | null;
  wallets: UserWallet[];
  telegramUser: TelegramUser | null;
  discordUser: DiscordUser | null;
};

export function getMemberSearchValue(userData: UserData): string {
  const { profile, memberPropertyValues = [], wallets, telegramUser, discordUser } = userData;
  // all account names
  const walletsString = wallets.map((wallet) => `${wallet.ensname || ''} ${wallet.address || ''}`).join(' ');
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
        return prop.value.join(' ');
      }
      return prop.value;
    })
    .join(' ');

  // all socials
  const socialsString = profile?.social ? Object.values(profile.social).join(' ') : '';

  return `${userDetailsString} ${walletsString} ${propertyValuesString} ${socialsString} ${telegramAccountString} ${discordAccountString}`
    .toLowerCase()
    .replace(/\s\s+/g, ' ');
}

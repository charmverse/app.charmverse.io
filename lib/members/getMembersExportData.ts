import { prisma } from '@charmverse/core/prisma-client';
import type { DiscordAccount } from '@root/lib/discord/client/getDiscordAccount';
import type { SelectOptionType } from '@root/lib/forms/interfaces';
import { getAllMemberPropertiesBySpace } from '@root/lib/members/getAccessibleMemberPropertiesBySpace';
import { getSpaceMembers } from '@root/lib/members/getSpaceMembers';

import type { TelegramAccount } from 'lib/telegram/interfaces';

export async function getMembersExportData(spaceId: string) {
  const members = await getSpaceMembers({ spaceId, skipAccessCheck: true });
  const usersWithAccounts = await prisma.spaceRole.findMany({
    where: { spaceId },
    include: {
      user: {
        include: {
          googleAccounts: {
            select: {
              email: true,
              name: true
            }
          },
          telegramUser: true,
          wallets: true,
          discordUser: true
        }
      }
    }
  });

  const properties = (await getAllMemberPropertiesBySpace({ spaceId })).filter(
    (prop) => !['profile_pic'].includes(prop.type)
  );

  const exportHeaders = ['id', 'Email', 'Google Accounts', 'Wallets', ...properties.map((prop) => prop.name)];

  const exportValues = members.map((member) => {
    const user = usersWithAccounts.find((u) => u.userId === member.id)?.user;

    const defaultValues = [
      member.id,
      user?.email,
      user?.googleAccounts.map((a) => `${a.name} <${a.email}>`) ?? '',
      user?.wallets.map((uw) => `${uw.address}${uw.ensname ? ` <${uw.ensname}>` : ''}`) ?? ''
    ];

    const propertyValues = properties.map((prop) => {
      const memberProperty = member.properties.find((mp) => mp.memberPropertyId === prop.id);

      // custom logic for fields with values not coming directly from memberProperty
      switch (prop.type) {
        case 'bio': {
          return member.profile?.description;
        }
        case 'role': {
          return member.roles.map((r) => r.name);
        }
        case 'discord': {
          return (
            member.profile?.social?.discordUsername ||
            (user?.discordUser?.account as unknown as DiscordAccount)?.username
          );
        }
        case 'twitter': {
          return member.profile?.social?.twitterURL;
        }
        case 'github': {
          return member.profile?.social?.githubURL;
        }
        case 'linked_in': {
          return member.profile?.social?.linkedinURL;
        }
        case 'timezone': {
          return member.profile?.timezone;
        }
        case 'join_date': {
          return member.joinDate;
        }
        case 'google': {
          return user?.googleAccounts[0]?.name;
        }
        case 'telegram': {
          return (user?.telegramUser?.account as unknown as TelegramAccount)?.username;
        }
        // map values for selects and multiselects
        case 'select':
        case 'multiselect': {
          if (!memberProperty?.value) return '';
          const values: string[] = Array.isArray(memberProperty?.value)
            ? memberProperty?.value
            : [memberProperty?.value].filter(Boolean);

          const options = prop.options as SelectOptionType[];
          const valueOptions = values
            .map((v) => options?.find((o) => (o as SelectOptionType).id === v))
            .filter(Boolean) as SelectOptionType[];

          return valueOptions.map((o) => o.name);
        }
        default: {
          return memberProperty?.value ?? '';
        }
      }
    });
    return [...defaultValues, ...propertyValues];
  });

  return [exportHeaders, ...exportValues];
}

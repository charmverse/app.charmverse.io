import { prisma } from '@charmverse/core/prisma-client';
import type { DiscordAccount } from '@root/lib/discord/client/getDiscordAccount';
import { getAccessibleMemberPropertiesBySpace } from '@root/lib/members/getAccessibleMemberPropertiesBySpace';
import { getCommonSpaceIds } from '@root/lib/members/getCommonSpaceIds';
import { getSpaceMemberMetadata } from '@root/lib/members/getSpaceMemberMetadata';
import type { CommonSpacesInput, MemberPropertyValuesBySpace } from '@root/lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from '@root/lib/members/utils';

import type { TelegramAccount } from 'lib/telegram/interfaces';

export async function getSpacesPropertyValues({
  memberId,
  requestingUserId,
  spaceId
}: CommonSpacesInput): Promise<MemberPropertyValuesBySpace[]> {
  const spaceIds = requestingUserId ? await getCommonSpaceIds({ spaceId, memberId, requestingUserId }) : [];
  const visibleMemberProperties = await getAccessibleMemberPropertiesBySpace({
    requestedUserId: memberId,
    spaceId: spaceIds,
    requestingUserId
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: memberId
    },
    select: {
      wallets: true,
      telegramUser: true,
      discordUser: true,
      googleAccounts: true
    }
  });

  const memberPropertyIds = visibleMemberProperties.map((mp) => mp.id);

  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      userId: memberId,
      memberPropertyId: {
        in: memberPropertyIds
      }
    }
  });

  let propertyValues = getPropertiesWithValues(visibleMemberProperties, memberPropertyValues, {
    withSpaceDetails: true
  });

  const spaceMetadataMap = await getSpaceMemberMetadata({ spaceIds, memberId });
  propertyValues = propertyValues.map((pv) => {
    if (memberPropertyIds.includes(pv.memberPropertyId)) {
      if (pv.type === 'role') {
        return { ...pv, value: spaceMetadataMap[pv.spaceId]?.roles || [] };
      } else if (pv.type === 'join_date') {
        return { ...pv, value: spaceMetadataMap[pv.spaceId]?.joinDate };
      } else if (pv.type === 'telegram') {
        const telegramAccount = user.telegramUser?.account as unknown as TelegramAccount;
        if (telegramAccount) {
          pv.value =
            telegramAccount.username || `${telegramAccount.first_name || ''} ${telegramAccount.last_name || ''}`;
        }
      } else if (pv.type === 'discord') {
        pv.value = (user.discordUser?.account as unknown as DiscordAccount)?.username;
      } else if (pv.type === 'google') {
        pv.value = user.googleAccounts[0]?.name;
      }
    }

    return pv;
  });

  return groupPropertyValuesBySpace(propertyValues);
}

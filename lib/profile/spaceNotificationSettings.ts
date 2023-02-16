import type { UserSpaceNotificationSettings } from '@prisma/client';

import { prisma } from 'db';

type SettingsQuery = { userId: string; spaceId: string };

export async function getSettings(query: SettingsQuery): Promise<UserSpaceNotificationSettings> {
  const dbNotifications = await prisma.userSpaceNotificationSettings.findUnique({
    where: {
      userId_spaceId: query
    }
  });
  return dbNotifications || _getDefaultSettings(query.spaceId, query.userId);
}

type ProposalCategoryFields = Pick<UserSpaceNotificationSettings, 'forumCategoriesMode' | 'forumCategories'>;

export async function toggleForumCategorySubscription(
  query: SettingsQuery,
  values: {
    categoryId: string;
    enabled: boolean;
  }
): Promise<UserSpaceNotificationSettings> {
  const settings = await getSettings(query);
  const settingsToUpdate: ProposalCategoryFields = {
    forumCategoriesMode: settings.forumCategoriesMode,
    forumCategories: settings.forumCategories
  };
  if (settingsToUpdate.forumCategoriesMode === 'whitelist') {
    if (values.enabled) {
      settingsToUpdate.forumCategories.push(values.categoryId);
    } else {
      settingsToUpdate.forumCategories = settingsToUpdate.forumCategories.filter((c) => c !== values.categoryId);
    }
  }
  // forumCategoriesMode === 'blacklist'
  else if (values.enabled) {
    settingsToUpdate.forumCategories = settingsToUpdate.forumCategories.filter((c) => c !== values.categoryId);
  } else {
    settingsToUpdate.forumCategories.push(values.categoryId);
  }

  const dbNotifications = await prisma.userSpaceNotificationSettings.upsert({
    where: {
      userId_spaceId: query
    },
    create: {
      ...settings,
      ...settingsToUpdate
    },
    update: settingsToUpdate
  });

  return dbNotifications;
}

// return a map of which categories the user is subscribed to
export async function getForumCategorySubscriptions(query: SettingsQuery): Promise<Record<string, boolean>> {
  const [settings, categoryIds] = await Promise.all([getSettings(query), _getCategoryIds(query.spaceId)]);
  const subscriptionMap = categoryIds.reduce<Record<string, boolean>>((acc, categoryId) => {
    const existsInList = settings.forumCategories.includes(categoryId);
    acc[categoryId] = settings.forumCategoriesMode === 'whitelist' ? existsInList : !existsInList;
    return acc;
  }, {});
  return subscriptionMap;
}

function _getCategoryIds(spaceId: string) {
  return prisma.postCategory
    .findMany({ where: { spaceId }, select: { id: true } })
    .then((categories) => categories.map((c) => c.id));
}

function _getDefaultSettings(spaceId: string, userId: string): UserSpaceNotificationSettings {
  return {
    spaceId,
    userId,
    forumCategoriesMode: 'blacklist',
    forumCategories: []
  };
}

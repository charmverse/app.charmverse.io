import type { UserSpaceNotificationSettings } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type ClientUserSpaceNotifications = {
  forums: {
    subscribeToNewCategories: boolean;
    categories: Record<string, boolean>;
  };
};

type SettingsQuery = { userId: string; spaceId: string };

// return a map of which categories the user is subscribed to
export async function getUserSpaceNotifications(query: SettingsQuery): Promise<ClientUserSpaceNotifications> {
  const [settings, categoryIds] = await Promise.all([
    getSavedOrDefaultSettings(query),
    _getSpaceCategoryIds(query.spaceId)
  ]);
  const subscriptionMap = categoryIds.reduce<Record<string, boolean>>((acc, categoryId) => {
    const existsInList = settings.forumCategories.includes(categoryId);
    acc[categoryId] = settings.forumCategoriesMode === 'whitelist' ? existsInList : !existsInList;
    return acc;
  }, {});

  return {
    forums: {
      subscribeToNewCategories: settings.forumCategoriesMode === 'blacklist',
      categories: subscriptionMap
    }
  };
}

export async function getSavedOrDefaultSettings(query: SettingsQuery): Promise<UserSpaceNotificationSettings> {
  const dbNotifications = await prisma.userSpaceNotificationSettings.findUnique({
    where: {
      userId_spaceId: query
    }
  });
  return dbNotifications || _getDefaultSettings(query.spaceId, query.userId);
}

function _getDefaultSettings(spaceId: string, userId: string): UserSpaceNotificationSettings {
  return {
    spaceId,
    userId,
    forumCategoriesMode: 'blacklist',
    forumCategories: []
  };
}

function _getSpaceCategoryIds(spaceId: string) {
  return prisma.postCategory
    .findMany({ where: { spaceId }, select: { id: true } })
    .then((categories) => categories.map((c) => c.id));
}

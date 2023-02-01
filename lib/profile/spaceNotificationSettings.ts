import type { UserSpaceNotificationSettings } from '@prisma/client';

import { prisma } from 'db';

export async function getSettings(query: { spaceId: string; userId: string }): Promise<UserSpaceNotificationSettings> {
  const dbNotifications = await prisma.userSpaceNotificationSettings.findUnique({
    where: {
      userId_spaceId: query
    }
  });
  return dbNotifications || _getDefaultSettings(query.spaceId, query.userId);
}

export async function updateSettings(query: {
  spaceId: string;
  userId: string;
}): Promise<UserSpaceNotificationSettings> {
  const dbNotifications = await prisma.userSpaceNotificationSettings.findUnique({
    where: {
      userId_spaceId: query
    }
  });
  if (dbNotifications) {
    return dbNotifications;
  }
  return {
    spaceId: query.spaceId,
    userId: query.userId,
    forumCategoriesMode: 'blacklist',
    forumCategories: []
  };
}

function _getDefaultSettings(spaceId: string, userId: string): UserSpaceNotificationSettings {
  return {
    spaceId,
    userId,
    forumCategoriesMode: 'blacklist',
    forumCategories: []
  };
}

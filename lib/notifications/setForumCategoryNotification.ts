import type { UserSpaceNotificationSettings } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { getSavedOrDefaultSettings } from './spaceNotifications';

export type SetForumCategoryNotificationInput = {
  userId: string;
  spaceId: string;
  categoryId: string;
  enabled: boolean;
};

export async function setForumCategoryNotification({
  categoryId,
  enabled,
  ...query
}: SetForumCategoryNotificationInput): Promise<UserSpaceNotificationSettings> {
  const settings = await getSavedOrDefaultSettings(query);

  const { categories } = _toggleCategory({
    categories: settings.forumCategories,
    mode: settings.forumCategoriesMode,
    categoryId,
    enabled
  });

  const dbNotifications = await prisma.userSpaceNotificationSettings.upsert({
    where: {
      userId_spaceId: query
    },
    create: {
      ...settings,
      forumCategories: categories
    },
    update: {
      forumCategories: categories
    }
  });

  return dbNotifications;
}

function _toggleCategory({
  categories,
  mode,
  categoryId,
  enabled
}: {
  categories: string[];
  mode: 'blacklist' | 'whitelist';
  categoryId: string;
  enabled: boolean;
}) {
  if (mode === 'whitelist') {
    if (enabled) {
      categories.push(categoryId);
    } else {
      categories = categories.filter((c) => c !== categoryId);
    }
  }
  // in this case, categoriesMode === 'blacklist'
  else if (enabled) {
    categories = categories.filter((c) => c !== categoryId);
  } else {
    categories.push(categoryId);
  }
  return { categories };
}

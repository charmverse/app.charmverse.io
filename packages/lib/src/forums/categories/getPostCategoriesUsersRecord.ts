import type { PostCategoryWithPermissions } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import { getUserSpaceNotifications } from '@packages/lib/userNotifications/spaceNotifications';

import { getPostCategories } from './getPostCategories';

export async function getPostCategoriesUsersRecord({ spaceId }: { spaceId: string }) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    }
  });

  const postCategoriesUsersRecord: Record<
    string,
    {
      userId: string;
      subscriptions: Record<string, boolean>;
      visiblePostCategories: PostCategoryWithPermissions[];
    }
  > = {};

  const postCategories = await getPostCategories(spaceId);
  const userIds = spaceRoles.map((spaceRole) => spaceRole.userId);
  const permissionClient = await getPermissionsClient({
    resourceId: spaceId,
    resourceIdType: 'space'
  });

  for (const userId of userIds) {
    const spaceNotifications = await getUserSpaceNotifications({ spaceId, userId });
    const visiblePostCategories = await permissionClient.client.forum.getPermissionedCategories({
      postCategories,
      userId
    });
    const subscriptions = spaceNotifications.forums.categories;
    postCategoriesUsersRecord[userId] = {
      subscriptions,
      userId,
      visiblePostCategories
    };
  }

  return postCategoriesUsersRecord;
}

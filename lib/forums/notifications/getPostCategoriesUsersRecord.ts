import { prisma } from '@charmverse/core/prisma-client';

import { getPermissionsClient } from 'lib/permissions/api';
import { getUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';

import { getPostCategories } from '../categories/getPostCategories';

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
      visibleCategoryIds: string[];
    }
  > = {};

  const postCategories = await getPostCategories(spaceId);
  const userIds = spaceRoles.map((spaceRole) => spaceRole.userId);

  for (const userId of userIds) {
    const spaceNotifications = await getUserSpaceNotifications({ spaceId, userId });
    const visiblePostCategories = await getPermissionsClient({
      resourceId: spaceId,
      resourceIdType: 'space'
    }).then(({ client }) =>
      client.forum.getPermissionedCategories({
        postCategories,
        userId
      })
    );
    const subscriptions = spaceNotifications.forums.categories;
    const visibleCategoryIds = visiblePostCategories.map((category) => category.id);
    postCategoriesUsersRecord[userId] = {
      subscriptions,
      userId,
      visibleCategoryIds
    };
  }

  return postCategoriesUsersRecord;
}

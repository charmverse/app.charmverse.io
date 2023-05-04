import type { CategoriesToFilter, PostCategoryWithPermissions } from '@charmverse/core';
import { AvailablePostCategoryPermissions, hasAccessToSpace, InvalidInputError, arrayUtils } from '@charmverse/core';

export async function getPermissionedCategories({
  postCategories,
  userId
}: CategoriesToFilter): Promise<PostCategoryWithPermissions[]> {
  // Avoid expensive computation
  if (postCategories.length === 0) {
    return [];
  }

  const uniqueSpaceIds = arrayUtils.uniqueValues(postCategories.map((category) => category.spaceId));

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError(`Cannot filter categories from multiple spaces at once.`);
  }

  const spaceId = uniqueSpaceIds[0];

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId,
    userId,
    disallowGuest: true
  });

  const permissions = new AvailablePostCategoryPermissions();

  if (isAdmin) {
    return postCategories.map((c) => ({ ...c, permissions: permissions.full }));
  } else if (spaceRole) {
    permissions.addPermissions(['create_post']);
  }

  return postCategories.map((c) => ({ ...c, permissions: permissions.operationFlags }));
}

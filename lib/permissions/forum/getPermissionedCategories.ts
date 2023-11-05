import { InvalidInputError } from '@charmverse/core/errors';
import type { CategoriesToFilter, PostCategoryWithPermissions } from '@charmverse/core/permissions';
import { AvailablePostCategoryPermissions, hasAccessToSpace } from '@charmverse/core/permissions';
import { arrayUtils } from '@charmverse/core/utilities';

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
    userId
  });

  const permissions = new AvailablePostCategoryPermissions();

  if (isAdmin) {
    return postCategories.map((c) => ({ ...c, permissions: permissions.full }));
  } else if (spaceRole) {
    permissions.addPermissions(['create_post', 'edit_category', 'delete_category', 'view_posts', 'comment_posts']);
  }

  return postCategories.map((c) => ({ ...c, permissions: permissions.operationFlags }));
}

import { InvalidInputError } from '@packages/core/errors';
import type { CategoriesToFilter, PostCategoryWithPermissions } from '@packages/core/permissions';
import { AvailablePostCategoryPermissions, hasAccessToSpace } from '@packages/core/permissions';
import { arrayUtils } from '@packages/core/utilities';

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

  const { isAdmin, spaceRole, isReadonlySpace } = await hasAccessToSpace({
    spaceId,
    userId
  });

  const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace });

  if (isAdmin) {
    return postCategories.map((c) => ({ ...c, permissions: permissions.full }));
  } else if (spaceRole) {
    permissions.addPermissions(['create_post', 'edit_category', 'delete_category', 'view_posts', 'comment_posts']);
  }

  return postCategories.map((c) => ({ ...c, permissions: permissions.operationFlags }));
}

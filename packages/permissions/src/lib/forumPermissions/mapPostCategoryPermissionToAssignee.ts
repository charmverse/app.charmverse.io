import type { PostCategoryPermission } from '@charmverse/core/prisma';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';

import { getPermissionAssignee } from 'lib/corePermissions';

export function mapPostCategoryPermissionToAssignee(
  postCategoryPermission: PostCategoryPermission
): AssignedPostCategoryPermission {
  return {
    id: postCategoryPermission.id,
    permissionLevel: postCategoryPermission.permissionLevel,
    postCategoryId: postCategoryPermission.postCategoryId,
    assignee: getPermissionAssignee(postCategoryPermission)
  };
}

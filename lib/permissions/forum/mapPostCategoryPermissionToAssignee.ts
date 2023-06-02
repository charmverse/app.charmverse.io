import type { AssignedPostCategoryPermission } from '@charmverse/core';
import type { PostCategoryPermission } from '@charmverse/core/prisma';

import { getPermissionAssignee } from '../utils';

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

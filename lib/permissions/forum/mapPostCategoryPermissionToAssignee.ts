import type { PostCategoryPermission } from '@prisma/client';

import { getPermissionAssignee } from '../utils';

import type { AssignedPostCategoryPermission } from './interfaces';

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

import type { AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import type { PostCategoryPermission } from '@charmverse/core/prisma';

import { InvalidPermissionGranteeError } from '../errors';
import type { TargetPermissionGroup } from '../interfaces';

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

export function getPermissionAssignee(
  permission: PostCategoryPermission
): TargetPermissionGroup<'public' | 'role' | 'space'> {
  if (permission.roleId) {
    return {
      group: 'role',
      id: permission.roleId
    };
  } else if (permission.spaceId) {
    return {
      group: 'space',
      id: permission.spaceId
    };
  } else {
    throw new InvalidPermissionGranteeError();
  }
}

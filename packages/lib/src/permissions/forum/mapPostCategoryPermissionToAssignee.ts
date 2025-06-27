import type { PostCategoryPermission } from '@charmverse/core/prisma';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';

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

function getPermissionAssignee(
  permission: Partial<Pick<PostCategoryPermission, 'public' | 'roleId' | 'spaceId'>>
): TargetPermissionGroup<'public' | 'role' | 'space'> {
  // Make sure we always have a single assignee
  if (permission.public && !permission.roleId && !permission.spaceId) {
    return {
      group: 'public'
    };
  } else if (permission.roleId && !permission.spaceId) {
    return {
      group: 'role',
      id: permission.roleId
    };
  } else if (permission.spaceId) {
    return {
      group: 'space',
      id: permission.spaceId
    };
  }
  throw new InvalidPermissionGranteeError();
}

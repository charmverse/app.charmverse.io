import type { PostCategoryPermission } from '@prisma/client';

import { InvalidPermissionGranteeError } from '../errors';

import type { AssignedPostCategoryPermission } from './interfaces';

export function mapPostCategoryPermissionToAssignee(
  postCategoryPermission: PostCategoryPermission
): AssignedPostCategoryPermission {
  const baseAssigneeData: Pick<AssignedPostCategoryPermission, 'permissionLevel' | 'postCategoryId' | 'id'> = {
    id: postCategoryPermission.id,
    permissionLevel: postCategoryPermission.permissionLevel,
    postCategoryId: postCategoryPermission.postCategoryId
  };

  // Make sure we always have a single assignee
  if (postCategoryPermission.public && !postCategoryPermission.roleId && !postCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'public'
      }
    };
  } else if (postCategoryPermission.roleId && !postCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'role',
        id: postCategoryPermission.roleId
      }
    };
  } else if (postCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'space',
        id: postCategoryPermission.spaceId
      }
    };
  }

  throw new InvalidPermissionGranteeError();
}

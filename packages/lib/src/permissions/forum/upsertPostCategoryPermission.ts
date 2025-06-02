import {
  SystemError,
  DataNotFoundError,
  InsecureOperationError,
  InvalidInputError,
  UndesirableOperationError
} from '@charmverse/core/errors';
import type {
  PostCategoryPermissionAssignment,
  AssignedPostCategoryPermission,
  AssignablePostCategoryPermissionGroups,
  AssignablePermissionGroups
} from '@charmverse/core/permissions';
import type { Prisma } from '@charmverse/core/prisma';
import { PostCategoryPermissionLevel } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

// Temporary - We will delete this file once all dependencies have been eliminated
const postCategoryPermissionGroups: AssignablePermissionGroups[] = ['role', 'space', 'public'];

class AssignmentNotPermittedError extends SystemError {
  constructor(group: AssignablePermissionGroups) {
    super({
      errorType: 'Invalid input',
      message: `This permission assignment to ${group} is invalid or unauthorised`,
      severity: 'warning'
    });
  }
}
export async function upsertPostCategoryPermission<
  T extends AssignablePostCategoryPermissionGroups = AssignablePostCategoryPermissionGroups
>({
  assignee,
  permissionLevel,
  postCategoryId
}: PostCategoryPermissionAssignment<T>): Promise<AssignedPostCategoryPermission<T>> {
  if (!stringUtils.isUUID(postCategoryId)) {
    throw new InvalidInputError('Valid post category ID is required');
  }

  if (assignee.group === 'role') {
    await prisma.role.findUniqueOrThrow({
      where: {
        id: assignee.id,
        archived: false
      }
    });
  }

  if (!permissionLevel || !PostCategoryPermissionLevel[permissionLevel]) {
    throw new InvalidInputError('Invalid permission level');
  } else if (permissionLevel === 'category_admin' || permissionLevel === 'moderator') {
    throw new UndesirableOperationError(
      `Permission level ${permissionLevel} is not assignable to individual post categories`
    );
  } else if (permissionLevel === 'custom') {
    throw new UndesirableOperationError('Custom permissions are not currently supported');
  }

  // Validate the assignee
  if (!assignee) {
    throw new InvalidInputError('Assignee is required');
  } else if (!postCategoryPermissionGroups.includes(assignee.group)) {
    throw new AssignmentNotPermittedError(assignee.group);
  } else if (assignee.group === 'public' && permissionLevel !== 'view') {
    throw new InsecureOperationError(
      'Cannot assign a public permission to a post category with a non-guest permission'
    );
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: postCategoryId
    },
    select: {
      spaceId: true
    }
  });

  if (!postCategory) {
    throw new DataNotFoundError(`Post category with id ${postCategoryId} not found`);
  }

  // Apply security against the assignees
  if (assignee.group === 'space' && assignee.id !== postCategory.spaceId) {
    throw new InsecureOperationError('Cannot assign a space permission to a post category in another space');
  } else if (assignee.group === 'role') {
    const role = await prisma.role.findUnique({
      where: {
        id: assignee.id
      },
      select: {
        spaceId: true
      }
    });

    if (role?.spaceId !== postCategory.spaceId) {
      throw new InsecureOperationError('Cannot assign a role permission to a post category in another space');
    }
  }

  // Use a unique compound input
  const whereQuery: Prisma.PostCategoryPermissionWhereUniqueInput =
    assignee.group === 'public'
      ? {
          public_postCategoryId: {
            public: true,
            postCategoryId
          }
        }
      : assignee.group === 'space'
        ? {
            spaceId_postCategoryId: {
              spaceId: assignee.id,
              postCategoryId
            }
          }
        : {
            roleId_postCategoryId: {
              roleId: assignee.id,
              postCategoryId
            }
          };

  const permission = await prisma.postCategoryPermission.upsert({
    where: whereQuery,
    create: {
      permissionLevel,
      postCategory: {
        connect: { id: postCategoryId }
      },
      role: assignee.group === 'role' ? { connect: { id: assignee.id } } : undefined,
      space: assignee.group === 'space' ? { connect: { id: assignee.id } } : undefined,
      public: assignee.group === 'public' ? true : undefined
    },
    update: {
      permissionLevel
    }
  });

  return mapPostCategoryPermissionToAssignee(permission) as AssignedPostCategoryPermission<T>;
}

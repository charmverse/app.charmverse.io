import { prisma } from '@charmverse/core';
import type { Prisma } from '@prisma/client';
import { ProposalCategoryPermissionLevel } from '@prisma/client';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { AssignmentNotPermittedError } from '../errors';

import type { AssignableProposalCategoryPermissionGroups, AssignedProposalCategoryPermission } from './interfaces';
import { proposalCategoryPermissionGroups } from './interfaces';
import { mapProposalCategoryPermissionToAssignee } from './mapProposalCategoryPermissionToAssignee';

export type ProposalCategoryPermissionInput<
  T extends AssignableProposalCategoryPermissionGroups = AssignableProposalCategoryPermissionGroups
> = Pick<AssignedProposalCategoryPermission<T>, 'assignee' | 'permissionLevel' | 'proposalCategoryId'>;

export async function upsertProposalCategoryPermission<
  T extends AssignableProposalCategoryPermissionGroups = AssignableProposalCategoryPermissionGroups
>({
  assignee,
  permissionLevel,
  proposalCategoryId
}: ProposalCategoryPermissionInput<T>): Promise<AssignedProposalCategoryPermission<T>> {
  if (!isUUID(proposalCategoryId)) {
    throw new InvalidInputError('Valid proposal category ID is required');
  }

  if (!permissionLevel || !ProposalCategoryPermissionLevel[permissionLevel]) {
    throw new InvalidInputError('Invalid permission level');
  }

  // Validate the assignee
  if (!assignee) {
    throw new InvalidInputError('Assignee is required');
  } else if (!proposalCategoryPermissionGroups.includes(assignee.group)) {
    throw new AssignmentNotPermittedError(assignee.group);
  } else if (assignee.group === 'public' && permissionLevel !== 'view') {
    throw new InsecureOperationError(
      'Cannot assign a public permission to a proposal category with a non-guest permission'
    );
  }

  const proposalCategory = await prisma.proposalCategory.findUnique({
    where: {
      id: proposalCategoryId
    },
    select: {
      spaceId: true
    }
  });

  if (!proposalCategory) {
    throw new ProposalCategoryNotFoundError(proposalCategoryId);
  }

  // Apply security against the assignees
  if (assignee.group === 'space' && assignee.id !== proposalCategory.spaceId) {
    throw new InsecureOperationError('Cannot assign a space permission to a proposal category in another space');
  } else if (assignee.group === 'role') {
    const role = await prisma.role.findUnique({
      where: {
        id: assignee.id
      },
      select: {
        spaceId: true
      }
    });

    if (role?.spaceId !== proposalCategory.spaceId) {
      throw new InsecureOperationError('Cannot assign a role permission to a proposal category in another space');
    }
  }

  // Use a unique compound input
  const whereQuery: Prisma.ProposalCategoryPermissionWhereUniqueInput =
    assignee.group === 'public'
      ? {
          public_proposalCategoryId: {
            public: true,
            proposalCategoryId
          }
        }
      : assignee.group === 'space'
      ? {
          spaceId_proposalCategoryId: {
            spaceId: assignee.id,
            proposalCategoryId
          }
        }
      : {
          roleId_proposalCategoryId: {
            roleId: assignee.id,
            proposalCategoryId
          }
        };

  const permission = await prisma.proposalCategoryPermission.upsert({
    where: whereQuery,
    create: {
      permissionLevel,
      proposalCategory: {
        connect: { id: proposalCategoryId }
      },
      role: assignee.group === 'role' ? { connect: { id: assignee.id } } : undefined,
      space: assignee.group === 'space' ? { connect: { id: assignee.id } } : undefined,
      public: assignee.group === 'public' ? true : undefined
    },
    update: {
      permissionLevel
    }
  });

  return mapProposalCategoryPermissionToAssignee(permission) as AssignedProposalCategoryPermission<T>;
}

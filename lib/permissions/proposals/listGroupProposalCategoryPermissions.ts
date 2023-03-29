import type { ProposalCategoryPermission } from '@prisma/client';

import { prisma } from 'db';
import log from 'lib/log';
import { InvalidInputError } from 'lib/utilities/errors';

import type { AssignedPermissionsQuery } from '../interfaces';
import { permissionGroupIsValid } from '../utils';

import type { AssignedProposalCategoryPermission } from './interfaces';
import { mapProposalCategoryPermissionToAssignee } from './mapProposalCategoryPermissionToAssignee';

export type PermissionsGroupQuery = Pick<AssignedPermissionsQuery, 'id' | 'group'>;

export async function listGroupProposalCategoryPermissions({
  id,
  group
}: PermissionsGroupQuery): Promise<AssignedProposalCategoryPermission[]> {
  if (!id || !permissionGroupIsValid(group)) {
    throw new InvalidInputError('Please verify your input for requesting computation of space permissions.');
  }

  let permissions: ProposalCategoryPermission[] = [];

  if (group === 'space') {
    permissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        spaceId: id
      }
    });
  } else if (group === 'role') {
    permissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        roleId: id
      }
    });
  } else {
    log.warn('listGroupProposalCategoryPermissions: invalid input', { id, group });
  }

  const mappedPermissions = permissions.map(mapProposalCategoryPermissionToAssignee);

  return mappedPermissions;
}

import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import type { ISystemError } from 'lib/utilities/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';

import type { PermissionAssigneeId } from '../permissions/interfaces';

/**
 * Call to endpoint using this can only proceed if the space permission mode is custom
 */
export function requireCustomPermissionMode ({ spaceIdKey, keyLocation }: { spaceIdKey: string, keyLocation: 'body' | 'query' }) {

  return async (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {

    // Where to find the space ID
    const spaceId = keyLocation === 'query' ? req.query[spaceIdKey] : req.body[spaceIdKey];

    if (!spaceId) {
      throw new InvalidInputError('Please provide a valid space Id');
    }

    const space = await prisma.space.findUnique({
      where: {
        id: spaceId
      }
    });

    if (!space) {
      throw new DataNotFoundError(`Space with id ${spaceId} not found`);
    }

    const { roleId, userId } = req.body as PermissionAssigneeId<'user'> | PermissionAssigneeId<'role'>;

    // We can still assign permissions to roles and users. We should only block space-level assignment
    if (space.permissionConfigurationMode !== 'custom' && !roleId && !userId) {
      throw new UnauthorisedActionError('This space must be in custom permissions mode in order to use this endpoint');
    }

    next();

  };

}

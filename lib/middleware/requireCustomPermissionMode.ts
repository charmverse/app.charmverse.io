import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError, ISystemError, UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';

/**
 * Call to endpoint using this can only proceed if the space permission mode is custom
 */
export function requireCustomPermissionMode ({ spaceIdKey, keyLocation }: {spaceIdKey: string, keyLocation: 'body' | 'query'}) {

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

    if (space.permissionConfigurationMode !== 'custom') {
      throw new UnauthorisedActionError('This space must be in custom permissions mode in order to use this endpoint');
    }

    next();

  };

}

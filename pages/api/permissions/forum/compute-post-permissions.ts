import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { PostNotFoundError } from 'lib/forums/posts/errors';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import type { AvailablePostPermissionFlags } from 'lib/permissions/forum/interfaces';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<AvailablePostPermissionFlags>) {
  const input = req.body as PermissionCompute;

  let resourceId = input.resourceId;

  if (!isUUID(input.resourceId)) {
    const [spaceDomain, postPath] = resourceId.split('/');
    if (!spaceDomain || !postPath) {
      throw new InvalidInputError(`Invalid post path and space domain`);
    }

    const post = await prisma.post.findFirst({
      where: {
        path: postPath,
        space: {
          domain: spaceDomain
        }
      },
      select: {
        id: true
      }
    });

    if (!post) {
      throw new PostNotFoundError(resourceId);
    } else {
      resourceId = post.id;
    }
  }

  const permissions = await getPermissionsClient({
    resourceId,
    resourceIdType: 'post'
  }).then((client) =>
    client.forum.computePostPermissions({
      resourceId,
      userId: req.session.user?.id
    })
  );

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);

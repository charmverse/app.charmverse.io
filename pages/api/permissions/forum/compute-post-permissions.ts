import type { PermissionCompute, PostPermissionFlags } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { isUUID } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { PostNotFoundError } from 'lib/forums/posts/errors';
import { onError, onNoMatch } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<PostPermissionFlags>) {
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

  const permissions = await getPermissionsClient({ resourceId, resourceIdType: 'post' }).then(({ client }) =>
    client.forum.computePostPermissions({
      resourceId,
      userId: req.session.user?.id
    })
  );

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);

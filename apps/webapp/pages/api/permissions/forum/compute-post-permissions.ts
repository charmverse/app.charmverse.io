import { prisma } from '@charmverse/core/prisma-client';
import type { PermissionCompute, PostPermissionFlags } from '@packages/core/permissions';
import { PostNotFoundError } from '@packages/lib/forums/posts/errors';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidInputError } from '@packages/utils/errors';
import { isUUID } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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

import { prisma } from '@charmverse/core/prisma-client';
import type { PagePermissionFlags, PermissionCompute } from '@packages/core/permissions';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { PageNotFoundError } from '@packages/pages/errors';
import { InvalidInputError } from '@packages/utils/errors';
import { isUUID } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePagePermissions);
async function computePagePermissions(req: NextApiRequest, res: NextApiResponse<PagePermissionFlags>) {
  const input = req.body as PermissionCompute;

  let resourceId = input.resourceId;

  if (!isUUID(resourceId)) {
    const [spaceDomain, pagePath] = resourceId.split('/');
    if (!spaceDomain || !pagePath) {
      throw new InvalidInputError(`Invalid page path and space domain`);
    }

    const searchQuery = generatePageQuery({
      pageIdOrPath: pagePath,
      spaceIdOrDomain: spaceDomain
    });

    const page = await prisma.page.findFirst({
      where: searchQuery,
      select: {
        id: true
      }
    });

    if (!page) {
      throw new PageNotFoundError(resourceId);
    } else {
      resourceId = page.id;
    }
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId,
    userId: req.session.user?.id
  });

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);

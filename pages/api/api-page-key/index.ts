import type { ApiPageKey, ApiPageKeyType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { uid } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(createApiKey)
  .use(requireKeys(['pageId'], 'query'))
  .get(getApiKeys);

async function getApiKeys(req: NextApiRequest, res: NextApiResponse<ApiPageKey[]>) {
  const pageId = req.query.pageId as string;
  const userId = req.session?.user?.id;

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permission to update this page');
  }

  const apiPageKeys = await prisma.apiPageKey.findMany({
    where: {
      pageId
    }
  });

  return res.status(200).json(apiPageKeys);
}

async function createApiKey(req: NextApiRequest, res: NextApiResponse<ApiPageKey>) {
  const pageId = req.body.pageId as string;
  const type = req.body.type as ApiPageKeyType;
  const userId = req.session?.user?.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permission to update this page');
  }

  const apiKey = uid();
  const apiPageKeys = await prisma.apiPageKey.upsert({
    where: {
      pageId_type: {
        pageId,
        type
      }
    },
    create: {
      pageId,
      type,
      apiKey,
      createdBy: userId
    },
    update: {}
  });

  return res.status(200).json(apiPageKeys);
}

export default withSessionRoute(handler);

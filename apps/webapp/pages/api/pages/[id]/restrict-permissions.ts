import type { PageMeta } from '@packages/core/pages';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .post(restrictPermissions);

async function restrictPermissions(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const pageId = req.query.id as string;

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session?.user?.id
  });

  if (computed.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permission to restrict permissions on this page');
  }

  const updatedPage = await req.premiumPermissionsClient.pages.lockPagePermissionsToBountyCreator({
    resourceId: pageId
  });

  return res.status(200).json(updatedPage);
}

export default withSessionRoute(handler);

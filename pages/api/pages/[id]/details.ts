
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { PageDetails } from 'lib/pages';
import { getPageDetails } from 'lib/pages/server/getPageDetails';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['id'], 'query'))
  .get(getPageDetailsHandler);

async function getPageDetailsHandler (req: NextApiRequest, res: NextApiResponse<PageDetails>) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const pageDetails = await getPageDetails(pageId, req.query.spaceId as string | undefined);

  if (!pageDetails) {
    throw new NotFoundError();
  }

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await computeUserPagePermissions({
    pageId: pageDetails.id,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  return res.status(200).json(pageDetails);
}

export default withSessionRoute(handler);

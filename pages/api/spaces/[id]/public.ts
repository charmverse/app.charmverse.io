
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpacePublicInfo } from 'lib/spaces/getSpacePublicInfo';
import type { PublicSpaceInfo } from 'lib/spaces/interfaces';
import { DataNotFoundError } from 'lib/utilities/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getSpaceInfoController);

async function getSpaceInfoController (req: NextApiRequest, res: NextApiResponse<PublicSpaceInfo>) {

  const { id: spaceId } = req.query;

  const publicInfo = await getSpacePublicInfo(spaceId as string);

  if (!publicInfo) {
    throw new DataNotFoundError(spaceId as string);
  }

  return res.status(200).json(publicInfo);
}

export default withSessionRoute(handler);

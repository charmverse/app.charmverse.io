
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpacesPublicInfo } from 'lib/spaces/getSpacesPublicInfo';
import type { PublicSpaceInfo } from 'lib/spaces/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getSpaceInfoController);

async function getSpaceInfoController (req: NextApiRequest, res: NextApiResponse<PublicSpaceInfo[]>) {

  const { search } = req.query;

  const publicSpaces = await getSpacesPublicInfo(search as string);

  return res.status(200).json(publicSpaces);
}

export default withSessionRoute(handler);

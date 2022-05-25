
import { Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { getSpacePublicInfo } from 'lib/spaces/getSpacePublicInfo';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { DataNotFoundError } from 'lib/utilities/errors';
import { PublicSpaceInfo } from 'lib/spaces/interfaces';

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

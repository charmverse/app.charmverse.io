import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGateDetails } from 'lib/blockchain/updateTokenGateDetails';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceWithTokenGates } from 'lib/spaces/getSpaceWithTokenGates';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import { replaceS3Domain } from 'lib/utilities/url';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireKeys([{ key: 'search', valueType: 'truthy' }], 'query'), getSpaceInfoController);

async function getSpaceInfoController(req: NextApiRequest, res: NextApiResponse<SpaceWithGates | null>) {
  const { search } = req.query;

  const publicSpace = await getSpaceWithTokenGates(search as string);

  // Add identifiable names to token gates
  const updatedTokenGates = await updateTokenGateDetails(publicSpace?.tokenGates);

  const updatedPublicSpace: SpaceWithGates | null = publicSpace
    ? { ...publicSpace, tokenGates: updatedTokenGates }
    : null;

  if (updatedPublicSpace?.spaceImage) {
    updatedPublicSpace.spaceImage = replaceS3Domain(updatedPublicSpace.spaceImage);
  }

  return res.status(200).json(updatedPublicSpace);
}

export default withSessionRoute(handler);

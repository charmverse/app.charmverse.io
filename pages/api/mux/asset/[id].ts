import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { Asset } from 'lib/mux/getAsset';
import { getPrivateAsset } from 'lib/mux/getAsset';
import { canView } from 'lib/mux/permissions';
import { withSessionRoute } from 'lib/session/withSession';

export type AssetRequest = {
  pageId: string;
  id: string;
  spaceId: string;
};

export type AssetResponse = Asset;

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAssetEndpoint);

async function getAssetEndpoint(req: NextApiRequest, res: NextApiResponse<AssetResponse>) {
  const query = req.query as AssetRequest;
  const isAllowed = await canView({
    userId: req.session.user?.id,
    resourceId: query.pageId,
    spaceId: query.spaceId
  });

  if (!isAllowed) {
    throw new ActionNotPermittedError();
  }

  const asset = await getPrivateAsset(query.id);

  res.status(200).json(asset);
}

export default withSessionRoute(handler);

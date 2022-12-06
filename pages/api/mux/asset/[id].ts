import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, ActionNotPermittedError } from 'lib/middleware';
import type { Asset } from 'lib/mux/getAsset';
import { getPrivateAsset } from 'lib/mux/getAsset';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

export type AssetRequest = {
  pageId: string;
  id: string;
};

export type AssetResponse = Asset;

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAssetEndpoint);

async function getAssetEndpoint(req: NextApiRequest, res: NextApiResponse<AssetResponse>) {
  const query = req.query as AssetRequest;
  const pagePermissions = await computeUserPagePermissions({
    userId: req.session.user?.id,
    pageId: query.pageId
  });

  if (!pagePermissions.read) {
    throw new ActionNotPermittedError();
  }

  const asset = await getPrivateAsset(query.id);

  res.status(200).json(asset);
}

export default withSessionRoute(handler);

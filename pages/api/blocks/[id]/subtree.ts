import { getSubtree } from '@root/lib/databases/subtree';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from 'lib/databases/block';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBlockSubtree);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

async function getBlockSubtree(req: NextApiRequest, res: NextApiResponse<BlockWithDetails[] | { error: string }>) {
  const subtree = await getSubtree({
    pageId: req.query.id as string,
    userId: req.session.user.id
  });

  return res.status(200).json(subtree);
}

export default withSessionRoute(handler);

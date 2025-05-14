import type { BlockWithDetails } from '@packages/databases/block';
import { getSubtree } from '@packages/databases/getSubtree';
import type { ServerBlockFields } from '@packages/databases/utils/blockUtils';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

// TODO: frontend should tell us which space to use

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
    userId: req.session.user?.id
  });

  return res.status(200).json(subtree);
}

export default withSessionRoute(handler);

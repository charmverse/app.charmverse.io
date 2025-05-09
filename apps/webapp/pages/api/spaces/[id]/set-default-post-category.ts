import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { setDefaultPostCategory } from '@packages/lib/forums/categories/setDefaultPostCategory';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['postCategoryId'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(setDefaultPostCategoryController);

async function setDefaultPostCategoryController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query as { id: string };
  const { postCategoryId } = req.body as { postCategoryId: string };

  const updatedSpace = await setDefaultPostCategory({
    postCategoryId,
    spaceId
  });
  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);

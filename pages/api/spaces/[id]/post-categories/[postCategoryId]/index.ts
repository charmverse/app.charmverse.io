import type { PostCategory } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updatePostCategory } from 'lib/forums/categories/updatePostCategory';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .put(updatePostCategoryController)
  .delete(deletePostCategoryController);

async function updatePostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategory>) {
  const { postCategoryId } = req.query;

  const updatedPostCategory = await updatePostCategory(postCategoryId as string, req.body);

  return res.status(200).json(updatedPostCategory);
}
async function deletePostCategoryController(req: NextApiRequest, res: NextApiResponse) {
  const { postCategoryId } = req.query;

  await prisma.postCategory.delete({
    where: {
      id: postCategoryId as string
    }
  });

  return res.status(200).json({});
}

export default withSessionRoute(handler);

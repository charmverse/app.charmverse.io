import type { PostCategory } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostCategory } from 'lib/forums/categories/deletePostCategory';
import { updatePostCategory } from 'lib/forums/categories/updatePostCategory';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requestOperations } from 'lib/permissions/requestOperations';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCategoryController).delete(deletePostCategoryController);

async function updatePostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategory>) {
  const { postCategoryId } = req.query;

  await requestOperations({
    resourceType: 'post_category',
    operations: ['edit_category'],
    resourceId: postCategoryId as string,
    userId: req.session.user.id
  });

  const updatedPostCategory = await updatePostCategory(postCategoryId as string, req.body);

  return res.status(200).json(updatedPostCategory);
}
async function deletePostCategoryController(req: NextApiRequest, res: NextApiResponse) {
  const { postCategoryId } = req.query;

  await requestOperations({
    resourceType: 'post_category',
    operations: ['delete_category'],
    resourceId: postCategoryId as string,
    userId: req.session.user.id
  });

  await deletePostCategory(postCategoryId as string);

  return res.status(200).end();
}

export default withSessionRoute(handler);

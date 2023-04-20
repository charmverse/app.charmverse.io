import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostCategory } from 'lib/forums/categories/deletePostCategory';
import { updatePostCategory } from 'lib/forums/categories/updatePostCategory';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import type { PostCategoryWithPermissions } from 'lib/permissions/forum/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCategoryController).delete(deletePostCategoryController);

async function updatePostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithPermissions>) {
  const { postCategoryId } = req.query as { postCategoryId: string };

  const userId = req.session.user.id;

  const permissions = await getPermissionsClient({
    resourceId: postCategoryId,
    resourceIdType: 'postCategory'
  }).then(({ forum }) =>
    forum.computePostCategoryPermissions({
      resourceId: postCategoryId,
      userId
    })
  );

  if (!permissions.edit_category) {
    throw new ActionNotPermittedError(`You cannot edit this category`);
  }
  const updatedPostCategory = await updatePostCategory(postCategoryId as string, req.body);

  return res.status(200).json({ ...updatedPostCategory, permissions });
}
async function deletePostCategoryController(req: NextApiRequest, res: NextApiResponse) {
  const { postCategoryId } = req.query;

  await deletePostCategory(postCategoryId as string);

  return res.status(200).end();
}

export default withSessionRoute(handler);

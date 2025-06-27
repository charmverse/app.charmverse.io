import type { PostCategoryWithPermissions } from '@packages/core/permissions';
import { deletePostCategory } from '@packages/lib/forums/categories/deletePostCategory';
import { updatePostCategory } from '@packages/lib/forums/categories/updatePostCategory';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'postCategoryId',
      location: 'query',
      resourceIdType: 'postCategory'
    })
  )
  .put(updatePostCategoryController)
  .delete(deletePostCategoryController);

async function updatePostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithPermissions>) {
  const { postCategoryId } = req.query as { postCategoryId: string };

  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
    resourceId: postCategoryId,
    userId
  });

  if (!permissions.edit_category) {
    throw new ActionNotPermittedError(`You cannot edit this category`);
  }
  const updatedPostCategory = await updatePostCategory(postCategoryId as string, req.body);

  return res.status(200).json({ ...updatedPostCategory, permissions });
}

async function deletePostCategoryController(req: NextApiRequest, res: NextApiResponse) {
  const { postCategoryId } = req.query;

  const permissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
    resourceId: postCategoryId as string,
    userId: req.session.user.id
  });

  if (!permissions.delete_category) {
    throw new ActionNotPermittedError(`You cannot delete this forum category`);
  }

  await deletePostCategory(postCategoryId as string);

  return res.status(200).end();
}

export default withSessionRoute(handler);

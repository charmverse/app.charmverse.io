import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';
import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { getPostCategories } from 'lib/forums/categories/getPostCategories';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computePostCategoryPermissions } from 'lib/permissions/forum/computePostCategoryPermissions';
import { filterAccessiblePostCategories } from 'lib/permissions/forum/filterAccessiblePostCategories';
import type { PostCategoryWithPermissions } from 'lib/permissions/forum/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPostCategoriesController)
  .use(requireUser)
  .use(requireKeys<CreatePostCategoryInput>(['name'], 'body'))
  .post(createPostCategoryController);

async function getPostCategoriesController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithPermissions[]>) {
  const userId = req.session.user?.id;

  const { id: spaceId } = req.query;
  const postCategories = await getPostCategories(spaceId as string);

  const filteredPostCategories = await filterAccessiblePostCategories({
    postCategories,
    userId
  });

  return res.status(200).json(filteredPostCategories);
}

async function createPostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithPermissions>) {
  const { id: spaceId } = req.query;

  const userId = req.session.user.id as string;

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id as string,
    spaceId: spaceId as string,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const postCategory = await createPostCategory({
    ...req.body,
    spaceId: spaceId as string
  });

  const permissions = await computePostCategoryPermissions({
    resourceId: postCategory.id,
    userId
  });

  return res.status(201).json({ ...postCategory, permissions });
}

export default withSessionRoute(handler);

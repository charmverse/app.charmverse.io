import type { PostCategory } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';
import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { getPostCategories } from 'lib/forums/categories/getPostCategories';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { filterAccessiblePostCategories } from 'lib/permissions/forum/filterAccessiblePostCategories';
import type { PostCategoryWithWriteable } from 'lib/permissions/forum/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getPostCategoriesController)
  .use(requireKeys<CreatePostCategoryInput>(['name'], 'body'))
  .post(createPostCategoryController);

async function getPostCategoriesController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithWriteable[]>) {
  const userId = req.session.user?.id as string;

  const { id: spaceId } = req.query;
  const postCategories = await getPostCategories(spaceId as string);

  const filteredPostCategories = await filterAccessiblePostCategories({
    postCategories,
    userId
  });

  return res.status(200).json(filteredPostCategories);
}

async function createPostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithWriteable>) {
  const { id: spaceId } = req.query;

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

  return res.status(201).json({ ...postCategory, create_post: true });
}

export default withSessionRoute(handler);

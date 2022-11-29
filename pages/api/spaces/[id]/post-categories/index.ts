import type { PostCategory } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { CreatePostCategoryInput } from 'lib/posts/createPostCategory';
import { createPostCategory } from 'lib/posts/createPostCategory';
import { getPostCategories } from 'lib/posts/getPostCategories';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getPostCategoriesController)
  .use(requireKeys<CreatePostCategoryInput>(['name'], 'body'))
  .post(createPostCategoryController);

async function getPostCategoriesController(req: NextApiRequest, res: NextApiResponse<PostCategory[]>) {
  const { id: spaceId } = req.query;

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id as string,
    spaceId: spaceId as string,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const postCategories = await getPostCategories(spaceId as string);

  return res.status(200).json(postCategories);
}
async function createPostCategoryController(req: NextApiRequest, res: NextApiResponse<PostCategory>) {
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

  return res.status(201).json(postCategory);
}

export default withSessionRoute(handler);

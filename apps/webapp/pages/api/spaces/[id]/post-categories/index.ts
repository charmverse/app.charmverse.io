import type { PostCategory } from '@charmverse/core/prisma';
import type { PostCategoryWithPermissions, PremiumPermissionsClient } from '@packages/core/permissions';
import type { CreatePostCategoryInput } from '@packages/lib/forums/categories/createPostCategory';
import { createPostCategory } from '@packages/lib/forums/categories/createPostCategory';
import { getPostCategories } from '@packages/lib/forums/categories/getPostCategories';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .get(getPostCategoriesController)
  .use(requireUser)
  .use(requireKeys<CreatePostCategoryInput>(['name'], 'body'))
  .post(createPostCategoryController);

async function getPostCategoriesController(req: NextApiRequest, res: NextApiResponse<PostCategoryWithPermissions[]>) {
  const userId = req.session.user?.id;

  const { id: spaceId } = req.query;
  const postCategories = await getPostCategories(spaceId as string);

  // TODO - Switch for real implementation

  const filteredPostCategories = await req.basePermissionsClient.forum.getPermissionedCategories({
    userId,
    postCategories
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

  const postCategory: PostCategory = await createPostCategory({
    name: req.body.name,
    spaceId: spaceId as string
  });

  const { client, type } = await getPermissionsClient({
    resourceId: postCategory.id,
    resourceIdType: 'postCategory'
  });

  if (type === 'premium') {
    await (client as PremiumPermissionsClient).forum.assignDefaultPostCategoryPermissions({
      resourceId: postCategory.id
    });
  }

  const permissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
    resourceId: postCategory.id,
    userId
  });

  return res.status(201).json({ ...postCategory, permissions });
}

export default withSessionRoute(handler);

import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from 'lib/forums/posts/searchForumPosts';
import { searchForumPosts } from 'lib/forums/posts/searchForumPosts';
import { onError, onNoMatch } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'spaceId',
      location: 'body',
      resourceIdType: 'space'
    })
  )
  .post(searchForumPostsController);

// TODO - Update posts
async function searchForumPostsController(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const searchQuery = req.body as SearchForumPostsRequest;
  const userId = req.session.user?.id;

  const shouldFilterCategories = req.spacePermissionsEngine === 'premium';

  if (shouldFilterCategories) {
    // Apply permissions to what we are searching for
    searchQuery.categoryId = (
      await req.premiumPermissionsClient.forum.mutatePostCategorySearch({
        spaceId: searchQuery.spaceId,
        categoryId: searchQuery.categoryId,
        userId
      })
    ).categoryId;
  }

  const searchResult = await searchForumPosts(searchQuery, userId);
  return res.status(200).json(searchResult);
}

export default withSessionRoute(handler);

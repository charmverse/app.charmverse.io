import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from 'lib/forums/posts/searchForumPosts';
import { searchForumPosts } from 'lib/forums/posts/searchForumPosts';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { checkSpacePermissionsEngine, premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<SearchForumPostsRequest>(['spaceId'], 'body')).post(searchForumPostsController);

// TODO - Update posts
async function searchForumPostsController(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const searchQuery = req.body as SearchForumPostsRequest;
  const userId = req.session.user?.id;

  const shouldFilterCategories =
    (await checkSpacePermissionsEngine({
      resourceId: searchQuery.spaceId,
      resourceIdType: 'space'
    })) === 'private';

  if (shouldFilterCategories) {
    // Apply permissions to what we are searching for
    searchQuery.categoryId = (
      await premiumPermissionsApiClient.forum.mutatePostCategorySearch({
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

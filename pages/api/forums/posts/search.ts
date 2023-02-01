import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from 'lib/forums/posts/searchForumPosts';
import { searchForumPosts } from 'lib/forums/posts/searchForumPosts';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { mutatePostCategorySearch } from 'lib/permissions/forum/mutatePostCategorySearch';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<SearchForumPostsRequest>(['spaceId', 'search'], 'body'))
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .post(searchForumPostsController);

// TODO - Update posts
async function searchForumPostsController(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const searchQuery = req.body as SearchForumPostsRequest;
  const userId = req.session.user.id;

  // Apply permissions to what we are searching for
  searchQuery.categoryId = (
    await mutatePostCategorySearch({ spaceId: searchQuery.spaceId, categoryId: searchQuery.categoryId, userId })
  ).categoryId;

  const searchResult = await searchForumPosts(searchQuery, userId);
  return res.status(200).json(searchResult);
}

export default withSessionRoute(handler);

import { hasAccessToSpace } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { InsecureOperationError } from 'lib/utilities/errors';

import { getForumPost } from './getForumPost';

export async function checkPostAccess({ postId, userId }: { postId: string; userId: string }) {
  const page = await getForumPost(postId);

  if (!page || !page.post) {
    throw new PageNotFoundError(postId);
  }

  // Only allow post author or space admin to update post
  if (userId !== page.createdBy) {
    const { isAdmin } = await hasAccessToSpace({ spaceId: page.spaceId, userId });

    if (!isAdmin) {
      throw new InsecureOperationError(`You can only edit your own posts`);
    }
  }

  return page;
}

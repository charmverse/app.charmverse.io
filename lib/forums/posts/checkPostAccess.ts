import { PageNotFoundError } from 'lib/public-api';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InsecureOperationError } from 'lib/utilities/errors';

import { getForumPost } from './getForumPost';

export async function checkPostAccess({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  // Only allow post author or space admin to update post
  if (userId !== page.createdBy) {
    const { isAdmin } = await hasAccessToSpace({ spaceId: page.spaceId, userId });

    if (!isAdmin) {
      throw new InsecureOperationError(`You can only edit your own posts`);
    }
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  return page;
}

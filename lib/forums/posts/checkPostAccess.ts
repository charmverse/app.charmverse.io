import { hasAccessToSpace } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';

import { getForumPost } from './getForumPost';

export async function checkPostAccess({ postId, userId }: { postId: string; userId: string }) {
  const page = await getForumPost(postId);

  if (!page || !page.post) {
    throw new PageNotFoundError(postId);
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

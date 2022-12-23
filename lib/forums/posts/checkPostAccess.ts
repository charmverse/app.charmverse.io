import { hasAccessToSpace } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';

import { getForumPost } from './getForumPost';

export async function checkPostAccess({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
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

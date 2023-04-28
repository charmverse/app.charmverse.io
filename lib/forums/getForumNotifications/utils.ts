import type { Post, Space } from '@charmverse/core/dist/prisma';

export function getPropertiesFromPost(
  post: Pick<Post, 'spaceId' | 'title' | 'id' | 'path'>,
  space: { domain: string; name: string }
) {
  return {
    postId: post.id,
    spaceId: post.spaceId,
    spaceDomain: space.domain,
    postPath: post.path,
    spaceName: space.name,
    postTitle: post.title || 'Untitled'
  } as const;
}

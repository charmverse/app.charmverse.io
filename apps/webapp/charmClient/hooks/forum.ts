import { useGET } from 'charmClient/hooks/helpers';
import type { PostWithVotes } from '@packages/lib/forums/posts/interfaces';

export function useForumPost(postId?: string) {
  return useGET<PostWithVotes>(postId ? `/api/forums/posts/${postId}` : null);
}

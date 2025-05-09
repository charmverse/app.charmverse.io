import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { CommentForm } from 'components/common/comments/CommentForm';
import type { CommentContent } from '@packages/lib/comments';
import type { PostCommentWithVote } from '@packages/lib/forums/comments/interface';

export function PostCommentForm({
  postId,
  setPostComments,
  disabled,
  placeholder
}: {
  postId: string;
  setPostComments: KeyedMutator<PostCommentWithVote[] | undefined>;
  disabled?: boolean;
  placeholder?: string;
}) {
  async function handleCreateComment(comment: CommentContent) {
    const postComment = await charmClient.forum.createPostComment(postId, comment);

    setPostComments((postComments) => (postComments ? [postComment, ...postComments] : [postComment]));
  }

  return <CommentForm disabled={disabled} handleCreateComment={handleCreateComment} placeholder={placeholder} />;
}

import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { CommentForm } from 'components/common/comments/CommentForm';
import type { CommentContent } from 'lib/comments';
import type { PostCommentWithVote } from 'lib/forums/comments/interface';

export function PostCommentForm({
  postId,
  setPostComments
}: {
  postId: string;
  setPostComments: KeyedMutator<PostCommentWithVote[] | undefined>;
}) {
  async function handleCreateComment(comment: CommentContent) {
    const postComment = await charmClient.forum.createPostComment(postId, comment);

    setPostComments((postComments) => (postComments ? [postComment, ...postComments] : [postComment]));
  }

  return <CommentForm handleCreateComment={handleCreateComment} />;
}

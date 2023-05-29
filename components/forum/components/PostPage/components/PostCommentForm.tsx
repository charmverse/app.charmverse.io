import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { CommentForm } from 'components/common/comments/CommentForm';
import type { CommentContent } from 'lib/comments';
import type { PostCommentWithVote } from 'lib/forums/comments/interface';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { ParagraphNode } from 'lib/prosemirror/interfaces';

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

  let initialValue;

  if (placeholder) {
    initialValue = { ...emptyDocument };
    initialValue.content = [
      { type: 'paragraph', content: [{ text: placeholder, type: 'text' }] } as ParagraphNode
    ] as any;
  }

  return (
    <CommentForm
      disabled={disabled}
      initialValue={placeholder && initialValue ? { doc: initialValue, rawText: placeholder } : undefined}
      handleCreateComment={handleCreateComment}
    />
  );
}

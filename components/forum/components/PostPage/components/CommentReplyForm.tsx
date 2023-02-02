import { useTheme } from '@emotion/react';
import { Stack } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';
import type { PostCommentWithVote } from 'lib/forums/comments/interface';

const defaultCharmEditorOutput: ICharmEditorOutput = {
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  },
  rawText: ''
};

export function CommentReplyForm({
  commentId,
  postId,
  onCreateComment,
  onCancelComment
}: {
  onCancelComment: () => void;
  onCreateComment: (postComment: PostCommentWithVote) => void;
  commentId: string;
  postId: string;
}) {
  const { user } = useUser();
  const theme = useTheme();
  const [postContent, setPostContent] = useState<ICharmEditorOutput>({
    ...defaultCharmEditorOutput
  });
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  function updateCommentContent(updatedContent: ICharmEditorOutput) {
    setPostContent(updatedContent);
  }

  async function createCommentReply() {
    const postComment = await charmClient.forum.createPostComment(postId, {
      content: postContent.doc,
      contentText: postContent.rawText,
      parentId: commentId
    });
    setPostContent({ ...defaultCharmEditorOutput });
    setEditorKey((key) => key + 1);
    onCreateComment(postComment);
    onCancelComment();
  }

  if (!user) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Box display='flex' gap={1} flexDirection='row' alignItems='flex-start'>
        <UserDisplay user={user} hideName={true} />
        <Box width='calc(100% - 48px)'>
          <InlineCharmEditor
            colorMode='dark'
            style={{
              minHeight: 100
            }}
            key={editorKey}
            content={postContent.doc}
            onContentChange={updateCommentContent}
            placeholderText='What are your thoughts?'
          />
        </Box>
      </Box>
      <Stack gap={1} flexDirection='row' alignSelf='flex-end'>
        <Button variant='outlined' color='secondary' onClick={onCancelComment}>
          Cancel
        </Button>
        <Button disabled={!postContent.rawText} onClick={createCommentReply}>
          Reply
        </Button>
      </Stack>
    </Stack>
  );
}

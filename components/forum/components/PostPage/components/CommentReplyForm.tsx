import { useTheme } from '@emotion/react';
import { Stack } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
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
      <Box display='flex' gap={1} flexDirection='row' alignItems='center'>
        <Avatar size='small' avatar={user.avatar} variant='circular' />
        <InlineCharmEditor
          style={{
            backgroundColor: theme.palette.background.light
          }}
          key={editorKey}
          content={postContent.doc}
          onContentChange={updateCommentContent}
          placeholderText='Reply to comment...'
        />
      </Box>
      <Stack gap={1} flexDirection='row' alignSelf='flex-end'>
        <Button variant='outlined' color='error' onClick={onCancelComment}>
          Cancel
        </Button>
        <Button disabled={!postContent.rawText} onClick={createCommentReply}>
          Reply
        </Button>
      </Stack>
    </Stack>
  );
}

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

export function PostCommentForm({
  postId,
  setPostComments
}: {
  postId: string;
  setPostComments: KeyedMutator<PostCommentWithVote[]>;
}) {
  const { user } = useUser();
  const theme = useTheme();
  const [postContent, setPostContent] = useState<ICharmEditorOutput>({
    ...defaultCharmEditorOutput
  });
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  function updatePostContent(updatedContent: ICharmEditorOutput) {
    setPostContent(updatedContent);
  }

  async function createPostComment() {
    const postComment = await charmClient.forum.createPostComment(postId, {
      content: postContent.doc,
      contentText: postContent.rawText,
      parentId: postId
    });
    setPostComments((postComments) => (postComments ? [postComment, ...postComments] : [postComment]));
    setPostContent({ ...defaultCharmEditorOutput });
    setEditorKey((key) => key + 1);
  }

  if (!user) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Box display='flex' gap={1} flexDirection='row'>
        <Avatar avatar={user.avatar} variant='circular' />
        <InlineCharmEditor
          style={{
            backgroundColor: theme.palette.background.light,
            minHeight: 100
          }}
          key={editorKey}
          content={postContent.doc}
          onContentChange={updatePostContent}
          placeholderText='Add comment to post...'
        />
      </Box>
      <Button
        sx={{
          alignSelf: 'flex-end'
        }}
        disabled={!postContent.rawText}
        onClick={createPostComment}
      >
        Comment
      </Button>
    </Stack>
  );
}

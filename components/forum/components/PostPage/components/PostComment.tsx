import { useTheme } from '@emotion/react';
import { Stack } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';

const defaultCharmEditorOutput: ICharmEditorOutput = {
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  },
  rawText: ''
};

export function PostComment({ postId }: { postId: string }) {
  const { user } = useUser();
  const theme = useTheme();
  const [postContent, setPostContent] = useState<ICharmEditorOutput>({
    ...defaultCharmEditorOutput
  });

  function updatePostContent(updatedContent: ICharmEditorOutput) {
    setPostContent(updatedContent);
  }

  async function createPostComment() {
    await charmClient.forum.createPostComment(postId, {
      content: postContent.doc,
      contentText: postContent.rawText,
      parentId: postId
    });
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
            backgroundColor: theme.palette.background.light
          }}
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

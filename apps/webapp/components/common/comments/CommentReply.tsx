import type { PageType } from '@charmverse/core/prisma-client';
import { Stack, Box, Typography, Switch } from '@mui/material';
import { checkIsContentEmpty } from '@packages/charmeditor/utils/checkIsContentEmpty';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import type { CreateCommentPayload } from 'components/common/comments/interfaces';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';

import { LoadingIcon } from '../LoadingComponent';

const defaultCharmEditorOutput: ICharmEditorOutput = {
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  },
  rawText: ''
};

export function CommentReply({
  commentId,
  handleCreateComment,
  onCancelComment
}: {
  onCancelComment: () => void;
  handleCreateComment: (comment: CreateCommentPayload) => Promise<void>;
  commentId: string;
}) {
  const { user } = useUser();
  const [postContent, setPostContent] = useState<ICharmEditorOutput>({
    ...defaultCharmEditorOutput
  });
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  function updateCommentContent(updatedContent: ICharmEditorOutput) {
    setPostContent(updatedContent);
  }

  async function createCommentReply() {
    await handleCreateComment({
      content: postContent.doc,
      contentText: postContent.rawText,
      parentId: commentId
    });

    setPostContent({ ...defaultCharmEditorOutput });
    setEditorKey((key) => key + 1);
    onCancelComment();
  }

  if (!user) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Box display='flex' gap={1} flexDirection='row' alignItems='flex-start'>
        <UserDisplay userId={user.id} hideName={true} />
        <Stack gap={1} width='100%'>
          <CharmEditor
            colorMode='dark'
            style={{
              minHeight: 100,
              left: 0
            }}
            key={editorKey}
            content={postContent.doc}
            onContentChange={updateCommentContent}
            placeholderText='What are your thoughts?'
            disableNestedPages
            disableRowHandles
          />

          <Stack flexDirection='row' justifyContent='flex-end' alignItems='center'>
            <Stack gap={1} flexDirection='row' alignSelf='flex-end'>
              <Button variant='outlined' color='secondary' onClick={onCancelComment}>
                Cancel
              </Button>
              <Button disabled={checkIsContentEmpty(postContent.doc)} onClick={createCommentReply}>
                Reply
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

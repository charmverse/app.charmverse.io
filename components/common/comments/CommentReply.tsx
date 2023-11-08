import { Stack, Box, Typography, Switch } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
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
  isPublishingComments,
  commentId,
  handleCreateComment,
  onCancelComment,
  setPublishToLens,
  publishToLens,
  showPublishToLens
}: {
  isPublishingComments?: boolean;
  showPublishToLens?: boolean;
  publishToLens?: boolean;
  setPublishToLens?: (publishToLens: boolean) => void;
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
        <UserDisplay user={user} hideName={true} />
        <Stack gap={1} width='100%'>
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

          <Stack flexDirection='row' justifyContent='flex-end' alignItems='center'>
            {showPublishToLens && (
              <>
                <Typography variant='body2' color='text.secondary'>
                  {isPublishingComments ? 'Publishing to Lens...' : 'Publish to Lens'}
                </Typography>
                {isPublishingComments ? (
                  <LoadingIcon size={16} sx={{ mx: 1 }} />
                ) : (
                  <Switch
                    sx={{ mr: 1, top: 2 }}
                    size='small'
                    checked={publishToLens}
                    onChange={(e) => setPublishToLens?.(e.target.checked)}
                  />
                )}
              </>
            )}
            <Stack gap={1} flexDirection='row' alignSelf='flex-end'>
              <Button variant='outlined' color='secondary' onClick={onCancelComment}>
                Cancel
              </Button>
              <Button disabled={!postContent.rawText} onClick={createCommentReply}>
                Reply
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

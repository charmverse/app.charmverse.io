import { Stack, Box, Typography, Switch } from '@mui/material';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';
import type { CommentContent } from 'lib/comments';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';

import { LoadingIcon } from '../LoadingComponent';

const defaultCharmEditorOutput: ICharmEditorOutput = {
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  },
  rawText: ''
};

export function CommentForm({
  showPublishToLens,
  handleCreateComment,
  initialValue,
  inlineCharmEditor,
  disabled,
  placeholder,
  setPublishToLens,
  publishToLens,
  isPublishingCommentsToLens
}: {
  isPublishingCommentsToLens?: boolean;
  publishToLens?: boolean;
  setPublishToLens?: (publishToLens: boolean) => void;
  showPublishToLens?: boolean;
  inlineCharmEditor?: boolean;
  initialValue?: ICharmEditorOutput;
  handleCreateComment: (comment: CommentContent) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { user } = useUser();
  const [postContent, setPostContent] = useState<ICharmEditorOutput>(
    initialValue ?? {
      ...defaultCharmEditorOutput
    }
  );
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  function updatePostContent(updatedContent: ICharmEditorOutput) {
    setPostContent(updatedContent);
  }

  async function createPostComment() {
    await handleCreateComment({
      content: postContent.doc,
      contentText: postContent.rawText
    });

    setPostContent({ ...defaultCharmEditorOutput });
    setEditorKey((key) => key + 1);
  }

  const editor = useMemo(() => {
    const editorCommentProps = {
      colorMode: 'dark' as const,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        minHeight: 100,
        left: 0
      },
      key: editorKey,
      disableRowHandles: true,
      focusOnInit: true,
      placeholderText: placeholder ?? 'What are your thoughts?',
      onContentChange: updatePostContent,
      content: postContent.doc,
      isContentControlled: true,
      disableNestedPages: true
    };

    if (!inlineCharmEditor) {
      return <CharmEditor {...editorCommentProps} readOnly={disabled} />;
    }

    return <InlineCharmEditor {...editorCommentProps} readOnly={disabled} />;
  }, [inlineCharmEditor, postContent, updatePostContent]);

  if (!user) {
    return null;
  }

  return (
    <Box display='flex' gap={1} flexDirection='row' alignItems='flex-start' data-test='comment-form' my={1}>
      <UserDisplay user={user} hideName={true} />
      <Stack gap={1} width='100%'>
        {editor}
        <Stack flexDirection='row' justifyContent='flex-end' alignItems='center'>
          {showPublishToLens && (
            <>
              <Typography variant='body2' color='text.secondary'>
                {isPublishingCommentsToLens ? 'Publishing to Lens...' : 'Publish to Lens'}
              </Typography>
              {isPublishingCommentsToLens ? (
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
          <Button
            data-test='comment-button'
            disabled={checkIsContentEmpty(postContent.doc) || disabled}
            onClick={createPostComment}
          >
            Comment
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

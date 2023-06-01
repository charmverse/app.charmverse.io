import { Stack, Box } from '@mui/material';
import { useMemo, useState } from 'react';

import Button from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';
import type { CommentContent } from 'lib/comments';

const defaultCharmEditorOutput: ICharmEditorOutput = {
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  },
  rawText: ''
};

export function CommentForm({
  handleCreateComment,
  initialValue,
  inlineCharmEditor,
  disabled,
  placeholder
}: {
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
        marginLeft: 8,
        minHeight: 100,
        left: 0
      },
      key: editorKey,
      disableRowHandles: true,
      focusOnInit: true,
      placeholderText: placeholder ?? 'What are your thoughts?',
      onContentChange: updatePostContent,
      content: postContent.doc,
      isContentControlled: true
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
    <Stack gap={1}>
      <Box display='flex' gap={1} flexDirection='row' alignItems='flex-start' data-test='comment-form'>
        <UserDisplay user={user} hideName={true} />
        {editor}
      </Box>
      <Button
        data-test='post-comment-button'
        sx={{
          alignSelf: 'flex-end'
        }}
        disabled={!postContent.rawText || disabled}
        onClick={createPostComment}
      >
        Comment
      </Button>
    </Stack>
  );
}

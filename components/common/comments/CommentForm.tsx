import { Stack, Box } from '@mui/material';
import { useState } from 'react';

import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
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
  initialValue
}: {
  initialValue?: ICharmEditorOutput;
  handleCreateComment: (comment: CommentContent) => Promise<void>;
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

  if (!user) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Box display='flex' gap={1} flexDirection='row' alignItems='flex-start'>
        <UserDisplay user={user} hideName={true} />
        <CharmEditor
          disableRowHandles
          disablePageSpecificFeatures
          colorMode='dark'
          style={{
            minHeight: 100,
            left: 0
          }}
          key={editorKey}
          content={postContent.doc}
          onContentChange={updatePostContent}
          placeholderText='What are your thoughts?'
        />
      </Box>
      <Button
        data-test='post-comment-button'
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

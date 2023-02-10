import { Stack, Box } from '@mui/material';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
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

export function PostCommentForm({
  postId,
  setPostComments
}: {
  postId: string;
  setPostComments: KeyedMutator<PostCommentWithVote[] | undefined>;
}) {
  const { user } = useUser();
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
      contentText: postContent.rawText
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

import { uuid } from '@bangle.dev/utils';
import { Divider, FormLabel } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { Application } from '@prisma/client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { RelativeDate } from 'components/common/CharmEditor/components/PageThread';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { ApplicationCommentForm } from './ApplicationCommentForm';

export function ApplicationComments({
  createdBy,
  applicationId,
  status,
  context
}: {
  createdBy: string;
  status: Application['status'];
  applicationId: string;
  context: 'applicant' | 'reviewer';
}) {
  const { members } = useMembers();
  const { user } = useUser();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents
  const {
    data: applicationComments = [],
    isLoading,
    mutate: refetchApplicationComments
  } = useSWR(`/application/${applicationId}/comments`, () =>
    charmClient.applicationComments.getComments(applicationId)
  );
  const member = members.find((c) => c.id === createdBy);

  function resetInput() {
    setEditorKey((key) => key + 1);
  }

  useEffect(() => {
    resetInput();
  }, [user, member]);

  async function onSendClicked(editorOutput: ICharmEditorOutput) {
    resetInput();
    const applicationComment = await charmClient.applicationComments.addComment(applicationId, {
      content: editorOutput.doc,
      contentText: editorOutput.rawText
    });
    refetchApplicationComments(
      (_applicationComments) => (_applicationComments ? [applicationComment, ..._applicationComments] : []),
      {
        revalidate: false
      }
    );
  }

  async function updateComment(pageCommentId: string, editorOutput: ICharmEditorOutput) {
    const updatedComment = await charmClient.applicationComments.editComment(applicationId, pageCommentId, {
      content: editorOutput.doc,
      contentText: editorOutput.rawText
    });

    refetchApplicationComments(
      (_applicationComments) =>
        _applicationComments
          ? _applicationComments.map((_applicationComment) =>
              _applicationComment.id === pageCommentId ? updatedComment : _applicationComment
            )
          : [],
      {
        revalidate: false
      }
    );
  }

  if (isLoading) {
    return (
      <Box my={5}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  return (
    <Stack>
      <Stack gap={2}>
        <FormLabel sx={{ fontWeight: 'bold' }}>Comments</FormLabel>
        {applicationComments.map((applicationComment) => {
          const commentCreator = members.find((_member) => _member.id === applicationComment.createdBy);

          return (
            <Stack key={applicationComment.id}>
              <RelativeDate createdAt={applicationComment.createdAt} updatedAt={applicationComment.updatedAt} />
              <ApplicationCommentForm
                hideButton={applicationComment.createdBy !== user?.id}
                buttonText='Edit'
                initialValue={{
                  doc: applicationComment.content as PageContent,
                  rawText: applicationComment.contentText
                }}
                avatar={commentCreator?.avatar}
                username={commentCreator?.username}
                onSubmit={async (editorOutput) => {
                  await updateComment(applicationComment.id, editorOutput);
                }}
              />
            </Stack>
          );
        })}
      </Stack>

      {status !== 'rejected' && (
        <>
          <Divider
            style={{
              marginBottom: 24,
              marginTop: 24
            }}
          />
          <FormLabel>
            <strong>Send a message (optional)</strong>
          </FormLabel>
          <ApplicationCommentForm
            $key={editorKey}
            key={editorKey}
            initialValue={
              user?.id
                ? {
                    doc:
                      context === 'reviewer'
                        ? getContentWithMention({ myUserId: user.id, targetUserId: createdBy })
                        : emptyDocument,
                    rawText: ''
                  }
                : null
            }
            username={user?.username}
            avatar={user?.avatar}
            onSubmit={onSendClicked}
          />
        </>
      )}
    </Stack>
  );
}

export function getContentWithMention({ myUserId, targetUserId }: { myUserId: string; targetUserId: string }) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'mention',
            attrs: {
              id: uuid(),
              type: 'user',
              value: targetUserId,
              createdAt: new Date().toISOString(),
              createdBy: myUserId
            }
          },
          {
            type: 'text',
            text: ' '
          }
        ]
      }
    ]
  };
}

import { uuid } from '@bangle.dev/utils';
import { Divider, FormLabel, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { Application } from '@prisma/client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

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
    charmClient.bounties.getApplicationComments(applicationId)
  );
  const member = members.find((c) => c.id === createdBy);
  const { showMemberProfile } = useMemberProfile();

  function resetInput() {
    setEditorKey((key) => key + 1);
  }

  useEffect(() => {
    resetInput();
  }, [user, member]);

  async function onSendClicked(editorOutput: ICharmEditorOutput) {
    resetInput();
    const applicationComment = await charmClient.bounties.addApplicationComment(applicationId, {
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
    const updatedComment = await charmClient.bounties.editApplicationComment(applicationId, pageCommentId, {
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
              <Stack flexDirection='row' alignItems='center'>
                <Box mr={1}>
                  <UserDisplay showMiniProfile avatarSize='small' user={commentCreator} hideName={true} />
                </Box>
                <Typography
                  mr={1}
                  onClick={() => {
                    if (commentCreator) {
                      showMemberProfile(commentCreator.id);
                    }
                  }}
                >
                  {commentCreator?.username}
                </Typography>
                <Typography variant='subtitle1' mr={0.5}>
                  {getRelativeTimeInThePast(new Date(applicationComment.createdAt))}
                </Typography>
                {applicationComment.createdAt !== applicationComment.updatedAt && !applicationComment.deletedAt && (
                  <Typography variant='subtitle2'>(Edited)</Typography>
                )}
              </Stack>
              <ApplicationCommentForm
                hideAvatar
                hideButton={applicationComment.createdBy !== user?.id}
                buttonText='Edit'
                initialValue={{
                  doc: applicationComment.content as PageContent,
                  rawText: applicationComment.contentText
                }}
                onSubmit={async (editorOutput) => {
                  await updateComment(applicationComment.id, editorOutput);
                }}
                disabled={applicationComment.createdBy !== user?.id}
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

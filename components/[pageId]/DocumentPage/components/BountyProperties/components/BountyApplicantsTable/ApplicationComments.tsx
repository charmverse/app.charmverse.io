import { FormLabel } from '@mui/material';
import { Box, Stack } from '@mui/system';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { RelativeDate } from 'components/common/CharmEditor/components/PageThread';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { ApplicationCommentForm } from './ApplicationCommentForm';

export function ApplicationComments({ applicationId }: { applicationId: string }) {
  const { data: applicationComments = [], isLoading } = useSWR(`/application/${applicationId}/comments`, () =>
    charmClient.applicationComments.getComments(applicationId)
  );

  const { user } = useUser();

  const { members } = useMembers();

  if (isLoading) {
    return (
      <Box my={5}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  function updateComment(pageCommentId: string, editorOutput: ICharmEditorOutput) {
    charmClient.applicationComments.editComment(applicationId, pageCommentId, {
      content: editorOutput.doc,
      contentText: editorOutput.rawText
    });
  }

  return (
    <Stack gap={2}>
      <FormLabel sx={{ fontWeight: 'bold' }}>Comments</FormLabel>
      {applicationComments.map((applicationComment) => {
        const member = members.find((_member) => _member.id === applicationComment.createdBy);

        return (
          <Stack key={applicationComment.id}>
            <RelativeDate createdAt={applicationComment.createdAt} updatedAt={applicationComment.updatedAt} />
            <ApplicationCommentForm
              buttonText='Edit'
              initialValue={{
                doc: applicationComment.content as PageContent,
                rawText: applicationComment.contentText
              }}
              disabled={user?.id !== applicationComment.createdBy}
              avatar={member?.avatar}
              username={member?.username}
              onSubmit={(editorOutput) => {
                updateComment(applicationComment.id, editorOutput);
              }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}

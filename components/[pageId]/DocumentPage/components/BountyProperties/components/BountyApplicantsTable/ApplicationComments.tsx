import { Box, Stack } from '@mui/system';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import { useMembers } from 'hooks/useMembers';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { BountyCommentForm } from '../BountyComment/BountyCommentForm';

export function ApplicationComments({ applicationId }: { applicationId: string }) {
  const { data: applicationComments = [], isLoading } = useSWR(`/application/${applicationId}/comments`, () =>
    charmClient.applicationComments.getComments(applicationId)
  );

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
    <Stack>
      {applicationComments.map((applicationComment) => {
        const member = members.find((_member) => _member.id === applicationComment.createdBy);

        return (
          <Box key={applicationComment.id}>
            <BountyCommentForm
              initialValue={{
                doc: applicationComment.content as PageContent,
                rawText: applicationComment.contentText
              }}
              avatar={member?.avatar}
              username={member?.username}
              onSubmit={(editorOutput) => {
                updateComment(applicationComment.id, editorOutput);
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

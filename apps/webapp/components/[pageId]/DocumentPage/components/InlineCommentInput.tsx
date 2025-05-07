import type { PageType } from '@charmverse/core/prisma-client';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import type { Theme } from '@mui/material';
import { Box, Divider, Stack, Typography, useMediaQuery } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { ThreadAccessGroup } from '@packages/lib/threads';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { useSnackbar } from 'hooks/useSnackbar';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';

export type InlineCommentInputHandleSubmitParams = {
  commentContent: PageContent;
  threadAccessGroups: ThreadAccessGroup[];
  event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>;
};

export function InlineCommentInput({
  pageType,
  handleSubmit
}: {
  pageType?: 'post' | PageType;
  handleSubmit: (params: InlineCommentInputHandleSubmitParams) => Promise<void> | void;
}) {
  const [threadAccessGroups, setThreadAccessGroups] = useState<ThreadAccessGroup[]>([]);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [commentContent, setCommentContent] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const { showMessage } = useSnackbar();
  const isEmpty = checkIsContentEmpty(commentContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Box p={1} width='100%'>
      {pageType === 'proposal' && (
        <Stack height='fit-content' gap={0.5}>
          <Stack flexDirection='row' gap={0.5} alignItems='center'>
            <PersonIcon fontSize='small' color='secondary' />
            <Typography variant='subtitle2'>Viewable by:</Typography>
          </Stack>
          <UserAndRoleSelect
            readOnly={isSubmitting}
            wrapColumn
            emptyPlaceholderContent='Everyone'
            readOnlyMessage='Everyone'
            value={threadAccessGroups}
            onChange={(options) => {
              const commentOptions = options.filter(
                (option) => option.group === 'user' || option.group === 'role'
              ) as ThreadAccessGroup[];
              setThreadAccessGroups(commentOptions);
            }}
          />
          <Divider />
        </Stack>
      )}
      <Box display='flex' width={{ xs: '100%', sm: '400px' }}>
        <Box flexGrow={1}>
          <InlineCharmEditor
            focusOnInit={true}
            content={commentContent}
            key={`${isSubmitting}`}
            readOnly={isSubmitting}
            style={{
              fontSize: '14px',
              padding: 0,
              minHeight: pageType === 'proposal' ? 100 : 'fit-content'
            }}
            onContentChange={({ doc }) => {
              setCommentContent(doc);
            }}
          />
        </Box>
        <Button
          data-test='save-new-inline-comment-button'
          disabled={isEmpty || isSubmitting}
          size='small'
          onClick={async (event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
            setIsSubmitting(true);
            try {
              await handleSubmit({
                event,
                commentContent,
                threadAccessGroups
              });
            } catch (_) {
              showMessage('Something went wrong. Please try again.', 'error');
            } finally {
              setIsSubmitting(false);
            }
          }}
          sx={{
            alignSelf: 'flex-end',
            minWidth: ['36px', '64px']
          }}
        >
          {isSmallScreen ? <SendIcon /> : 'Start'}
        </Button>
      </Box>
    </Box>
  );
}

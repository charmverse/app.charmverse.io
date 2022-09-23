import { useEditorViewContext } from '@bangle.dev/react';
import type { EditorState } from '@bangle.dev/pm';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Check, Close, RateReviewOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import Button from 'components/common/Button';
import type { Contributor } from 'hooks/useContributors';
import { useContributors } from 'hooks/useContributors';
import { accept } from 'components/common/CharmEditor/fiduswriter/track/accept';
import { acceptAll } from 'components/common/CharmEditor/fiduswriter/track/acceptAll';
import { reject } from 'components/common/CharmEditor/fiduswriter/track/reject';
import { rejectAll } from 'components/common/CharmEditor/fiduswriter/track/rejectAll';
import { getTracksFromDoc } from 'components/common/CharmEditor/fiduswriter/track/getTracks';
import type { TrackType } from 'components/common/CharmEditor/fiduswriter/track/interfaces';
import UserDisplay from 'components/common/UserDisplay';
import { CommentDate } from 'components/common/CharmEditor/components/PageThread';
import log from 'lib/log';
import { NoCommentsMessage } from './CommentsSidebar';

export default function SuggestionsSidebar ({ readOnly, state }: { readOnly: boolean, state: EditorState | null }) {
  const view = useEditorViewContext();
  const [contributors] = useContributors();

  const [suggestions, setSuggestions] = useState<ReturnType<typeof getTracksFromDoc>>([]);

  // listen to changes on the doc like when suggestions are added/deleted
  useEffect(() => {
    if (view.state) {
      setSuggestions(getTracksFromDoc({ state: view.state }));
    }
  }, [view.state.doc]);

  // listen to changes from selection (see CharmEditor)
  useEffect(() => {
    if (state) {
      setSuggestions(getTracksFromDoc({ state }));
    }
  }, [state]);

  log.debug('suggestions', suggestions);

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  function acceptOne (type: string, pos: number) {
    accept(type, pos, view);
  }

  function rejectOne (type: string, pos: number) {
    reject(type, pos, view);
  }

  return (
    <>
      {!readOnly && suggestions.length > 0 && (
        <Box display='flex' gap={1} flexDirection='row' position='absolute' top={0} right={8}>
          <Button size='small' startIcon={<Check />} disableElevation variant='text' color='primary' onClick={clickAcceptAll}>
            Accept All
          </Button>
          <Button size='small' startIcon={<Close />} disableElevation variant='text' color='primary' onClick={clickRejectAll}>
            Reject All
          </Button>
        </Box>
      )}
      <Stack gap={2}>
        {suggestions.map(({ active, data, node, pos, type }) => {
          return (
            <Paper sx={{ p: 2, left: active ? -16 : 0, position: 'relative', transition: 'left ease-in .15s' }} elevation={active ? 4 : 1} variant={active ? undefined : 'outlined'}>
              <Stack key={pos + type} gap={1}>
                <Box display='flex' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <SidebarUser user={contributors.find(contributor => contributor.id === data.user)} />
                    <CommentDate createdAt={data.date} />
                  </Box>
                  <Box display='flex' gap={1}>
                    <Tooltip title='Accept suggestion'>
                      <IconButton
                        color='primary'
                        onClick={() => {
                          acceptOne(type, pos);
                        }}
                        size='small'
                      >
                        <Check />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Reject suggestion'>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={() => {
                          rejectOne(type, pos);
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant='body2'>
                  {type === 'format_change' && data.before instanceof Array && data.after instanceof Array && <FormatChangeDisplay before={data.before} after={data.after} />}
                  {type !== 'format_change' && <ActionDisplay type={type} nodeType={node.type.name} content={node.textContent} />}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      {suggestions.length === 0 && (
        <NoCommentsMessage
          icon={(
            <RateReviewOutlined
              fontSize='large'
              color='secondary'
              sx={{
                height: '2em',
                width: '2em'
              }}
            />
          )}
          message='No suggestions yet'
        />
      )}
    </>
  );
}

const FORMAT_MARK_NAMES: Record<string, string> = {
  em: 'Emphasis',
  strong: 'Strong',
  underline: 'Underline'
};

const VERBS: Record<TrackType, string> = {
  deletion: 'Delete',
  insertion: 'Add',
  block_change: 'Block change',
  format_change: 'Format'
};

const ACTIONS: Record<string, string> = {
  insertion_paragraph: 'New paragraph',
  insertion_heading: 'New heading',
  insertion_blockquote: 'Wrapped into blockquote',
  insertion_codeBlock: 'Added code block',
  insertion_figure: 'Inserted figure',
  insertion_list_item: 'New list item',
  insertion_table: 'Inserted table',
  deletion_paragraph: 'Merged paragraph',
  deletion_heading: 'Merged heading',
  deletion_blockquote: 'Unwrapped blockquote',
  deletion_codeBlock: 'Removed code block',
  deletion_list_item: 'Lifted list item',
  deletion_table: 'Delete table',
  block_change_paragraph: 'Changed into paragraph',
  block_change_heading: 'Changed heading level',
  block_change_codeBlock: 'Changed into code block'
};

function ActionDisplay ({ type, nodeType, content }: { type: TrackType, nodeType: string, content?: string }) {
  const nodeActionType = `${type}_${nodeType}`;
  if (ACTIONS[nodeActionType]) {
    return <span>{ACTIONS[nodeActionType]}</span>;
  }
  else {
    return <><strong>{VERBS[type]}:</strong> {content}</>;
  }
}

function FormatChangeDisplay ({ before, after }: { before: string[], after: string[] }) {
  if (before.length) {
    return <><strong>Remove format:</strong> {before.map(markName => FORMAT_MARK_NAMES[markName]).join(', ')}</>;
  }
  if (after.length) {
    return <><strong>Add format:</strong> {after.map(markName => FORMAT_MARK_NAMES[markName]).join(', ')}</>;
  }
  return null;
}

function SidebarUser ({ user }: { user?: Contributor }) {
  if (!user) return null;
  return (
    <UserDisplay
      component='div'
      user={user}
      avatarSize='small'
      fontSize={14}
      fontWeight={500}
    />
  );

}

import { useEditorViewContext } from '@bangle.dev/react';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import type { Contributor } from 'hooks/useContributors';
import { useContributors } from 'hooks/useContributors';
import UserDisplay from 'components/common/UserDisplay';
import { CommentDate } from '../PageThread';
import { accept } from './track/accept';
import { reject } from './track/reject';
import type { TrackedEvent } from './getEvents';
import type { TrackType } from './track/interfaces';

const FORMAT_MARK_NAMES: Record<string, string> = {
  italic: 'italic',
  bold: 'bold',
  code: 'code',
  underline: 'underline'
};

const VERBS: Record<TrackType, string> = {
  deletion: 'Delete',
  insertion: 'Add',
  block_change: 'Block change',
  format_change: 'Format'
};

const ACTIONS: Record<string, string> = {
  insertion_paragraph: 'New paragraph',
  insertion_horizontalRule: 'New horizontal rule',
  insertion_heading: 'New heading',
  insertion_blockquote: 'Wrapped into callout',
  insertion_codeBlock: 'Added code block',
  insertion_listItem: 'New list item',
  insertion_table: 'Inserted table',
  deletion_paragraph: 'Merged paragraph',
  deletion_heading: 'Merged heading',
  deletion_blockquote: 'Unwrapped blockquote',
  deletion_codeBlock: 'Removed code block',
  deletion_listItem: 'Lifted list item',
  deletion_table: 'Delete table',
  block_change_bulletList: 'Added bullet list item',
  block_change_orderedList: 'Added ordered list item',
  block_change_listItem: 'Changed into list item',
  block_change_paragraph: 'Changed into paragraph',
  block_change_heading: 'Changed heading level',
  block_change_codeBlock: 'Changed into code block'
};

// isOwner allows owners to always delete their own suggestions
type Props = TrackedEvent & { readOnly?: boolean, isOwner?: boolean };

export function SuggestionCard ({ readOnly, isOwner, active, data, node, pos, type }: Props) {
  const view = useEditorViewContext();
  const [contributors] = useContributors();
  // get parentNode for lists
  const parentNode = pos > 0 ? view.state.doc.nodeAt(pos - 1) : null;

  function acceptOne (_type: string, _pos: number) {
    accept(_type, _pos, view);
  }

  function rejectOne (_type: string, _pos: number) {
    reject(_type, _pos, view);
  }

  return (
    <Paper sx={{ p: 2, left: active ? -16 : 0, position: 'relative', transition: 'left ease-in .15s' }} elevation={active ? 4 : 0} variant={active ? undefined : 'outlined'}>
      <Stack gap={1}>
        <Box display='flex' justifyContent='space-between'>
          <Box display='flex' alignItems='center' gap={1}>
            <SidebarUser user={contributors.find(contributor => contributor.id === data.user)} />
            <CommentDate createdAt={data.date} />
          </Box>
          <Box display='flex' gap={1}>
            {!readOnly && (
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
            )}
            {(!readOnly || isOwner) && (
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
            )}
          </Box>
        </Box>
        <Typography variant='body2'>
          {type === 'format_change' && data.before instanceof Array && data.after instanceof Array && <FormatChangeDisplay before={data.before} after={data.after} />}
          {type !== 'format_change' && <FormattedAction type={type} parentNodeType={parentNode?.type.name} nodeType={node.type.name} content={node.textContent} />}
        </Typography>
      </Stack>
    </Paper>
  );
}

type ActionInfo = {
  type: TrackType;
  nodeType: string;
  parentNodeType?: string;
  content?: string
};

// For these types, the nodeType would be 'paragraph' but we want to show the container type instead
const containerNodeTypes = ['bulletList', 'orderedList', 'listItem'];

function FormattedAction ({ type, nodeType, parentNodeType = '', content }: ActionInfo) {
  const friendlyNodeType = containerNodeTypes.includes(parentNodeType) ? parentNodeType : nodeType;
  const nodeActionType = `${type}_${friendlyNodeType}`;

  if (ACTIONS[nodeActionType]) {
    return <span>{ACTIONS[nodeActionType]}</span>;
  }
  else {
    return <><strong>{VERBS[type]}:</strong> "{content}"</>;
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

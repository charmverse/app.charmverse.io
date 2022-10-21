import { useEditorViewContext } from '@bangle.dev/react';
import { Check, Close } from '@mui/icons-material';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { memo, useMemo } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import { RelativeDate } from '../PageThread';

import type { TrackedEvent } from './getEvents';
import { accept } from './track/accept';
import type { TrackType } from './track/interfaces';
import { reject } from './track/reject';

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
  insertion_blockquote: 'Wrapped into callout',
  insertion_codeBlock: 'Added code block',
  insertion_columnBlock: 'Added column layout',
  insertion_cryptoPrice: 'Added crypto price',
  insertion_disclosureSummary: 'Added toggle section',
  insertion_heading: 'New heading',
  insertion_horizontalRule: 'New horizontal rule',
  insertion_iframe: 'Added embed',
  insertion_image: 'Added image',
  insertion_listItem: 'New list item',
  insertion_paragraph: 'New paragraph',
  insertion_pdf: 'Added pdf',
  insertion_table: 'Added table',
  deletion_blockquote: 'Unwrapped blockquote',
  deletion_codeBlock: 'Removed code block',
  deletion_columnBlock: 'Removed column layout',
  deletion_cryptoPrice: 'Removed crypto price',
  deletion_disclosureSummary: 'Removed toggle section',
  deletion_heading: 'Merged heading',
  deletion_iframe: 'Removed embed',
  deletion_image: 'Removed image',
  deletion_listItem: 'Lifted list item',
  deletion_paragraph: 'Merged paragraph',
  deletion_pdf: 'Removed pdf',
  deletion_table: 'Revmoed table',
  block_change_bulletList: 'Added bullet list item',
  block_change_orderedList: 'Added ordered list item',
  block_change_listItem: 'Changed into list item',
  block_change_paragraph: 'Changed into paragraph',
  block_change_heading: 'Changed heading level',
  block_change_codeBlock: 'Changed into code block'
};
// For these types, the nodeType would be 'paragraph' but we want to show the container type instead
const containerNodeTypes = ['listItem', 'columnBlock', 'disclosureSummary'];

// isOwner allows owners to always delete their own suggestions
type Props = TrackedEvent & { readOnly?: boolean, isOwner?: boolean };

function SuggestionCardComponent ({ readOnly, isOwner, active, data, node, pos, type }: Props) {
  const view = useEditorViewContext();
  const { members } = useMembers();
  // get parentNode for lists
  const parentNode = useMemo(() => (
    pos > 0 && pos < view.state.doc.nodeSize ? view.state.doc.nodeAt(pos - 1) : null
  ), [pos]);

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
            <SidebarUser user={members.find(member => member.id === data.user)} />
            <RelativeDate createdAt={data.date} />
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

export const SuggestionCard = memo(SuggestionCardComponent);

type ActionInfo = {
  type: TrackType;
  nodeType: string;
  parentNodeType?: string;
  content?: string;
};

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

function SidebarUser ({ user }: { user?: Member }) {
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

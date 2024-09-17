import { Check, Close } from '@mui/icons-material';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { memo, useMemo } from 'react';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import type { Member } from 'lib/members/interfaces';

import { accept } from '../fiduswriter/track/accept';
import type { TrackType } from '../fiduswriter/track/interfaces';
import { reject } from '../fiduswriter/track/reject';
import { RelativeDate } from '../thread/PageThread';

import type { TrackedEvent } from './getEvents';

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
  insertion_poll: 'Added poll',
  insertion_disclosureSummary: 'Added toggle section',
  insertion_heading: 'New heading',
  insertion_horizontalRule: 'New horizontal rule',
  insertion_iframe: 'Added embed',
  insertion_image: 'Added image',
  insertion_list_item: 'New list item',
  insertion_listItem: 'New list item',
  insertion_paragraph: 'New paragraph',
  insertion_pdf: 'Added pdf',
  insertion_tabIndent: 'Add whitespace',
  insertion_table: 'Added table',
  deletion_blockquote: 'Unwrapped blockquote',
  deletion_codeBlock: 'Removed code block',
  deletion_columnBlock: 'Removed column layout',
  deletion_cryptoPrice: 'Removed crypto price',
  deletion_poll: 'Removed poll',
  deletion_disclosureSummary: 'Removed toggle section',
  deletion_heading: 'Merged heading',
  deletion_iframe: 'Removed embed',
  deletion_image: 'Removed image',
  deletion_list_item: 'Removed list item',
  deletion_listItem: 'Removed list item',
  deletion_paragraph: 'Merged paragraph',
  deletion_pdf: 'Removed pdf',
  deletion_tabIndent: 'Remove whitespace',
  deletion_table: 'Revmoed table',
  block_change_bullet_list: 'Added bullet list item',
  block_change_ordered_list: 'Added ordered list item',
  block_change_bulletList: 'Added bullet list item',
  block_change_orderedList: 'Added ordered list item',
  block_change_listItem: 'Changed into list item',
  block_change_paragraph: 'Changed into paragraph',
  block_change_heading: 'Changed heading level',
  block_change_codeBlock: 'Changed into code block'
};
// For these types, the nodeType would be 'paragraph' but we want to show the container type instead
const containerNodeTypes = ['listItem', 'list_item', 'columnBlock', 'disclosureSummary'];

// isOwner allows owners to always delete their own suggestions
type Props = TrackedEvent & { readOnly?: boolean; isOwner?: boolean; pageId: string; spaceId: string };

function SuggestionCardComponent({ readOnly, isOwner, active, data, node, pos, type, pageId, spaceId }: Props) {
  const { view } = useCharmEditorView();
  const { getMemberById } = useMembers();
  const { pages } = usePages();
  let content = node.textContent;

  if (node.type.name === 'emoji') {
    content = node.attrs.emoji;
  } else if (node.type.name === 'mention') {
    if (node.attrs.type === 'user') {
      content = getMemberById(node.attrs.value)?.username ?? '';
    } else {
      content = pages[node.attrs.value]?.title ?? 'Untitled';
    }
  }

  // get parentNode for lists
  const parentNode = useMemo(
    () => view && (pos > 0 && pos < view.state.doc.nodeSize ? view.state.doc.nodeAt(pos - 1) : null),
    [pos]
  );

  function acceptOne(_type: string, _pos: number) {
    if (!view) throw new Error('No editor view to accept suggestion');
    accept(_type, _pos, view);
    charmClient.track.trackAction('page_suggestion_accepted', { pageId, spaceId });
  }

  function rejectOne(_type: string, _pos: number) {
    if (!view) throw new Error('No editor view to reject suggestion');
    reject(_type, _pos, view);
  }

  return (
    <Paper
      sx={{ p: 2, left: active ? -16 : 0, position: 'relative', transition: 'left ease-in .15s' }}
      elevation={active ? 4 : 0}
      variant={active ? undefined : 'outlined'}
    >
      <Stack gap={1}>
        <Box display='flex' justifyContent='space-between'>
          <Box display='flex' alignItems='center' gap={1}>
            <SidebarUser user={getMemberById(data.user)} />
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
          {type === 'format_change' && data.before instanceof Array && data.after instanceof Array && (
            <FormatChangeDisplay before={data.before} after={data.after} />
          )}
          {type !== 'format_change' && (
            <FormattedAction
              type={type}
              parentNodeType={parentNode?.type.name}
              nodeType={node.type.name}
              content={content}
            />
          )}
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

function FormattedAction({ type, nodeType, parentNodeType = '', content }: ActionInfo) {
  const friendlyNodeType = containerNodeTypes.includes(parentNodeType) ? parentNodeType : nodeType;
  const nodeActionType = `${type}_${friendlyNodeType}`;

  if (ACTIONS[nodeActionType]) {
    return <span>{ACTIONS[nodeActionType]}</span>;
  } else {
    return (
      <>
        <strong>{VERBS[type]}:</strong> "{content}"
      </>
    );
  }
}

function FormatChangeDisplay({ before, after }: { before: string[]; after: string[] }) {
  if (before.length) {
    return (
      <>
        <strong>Remove format:</strong> {before.map((markName) => FORMAT_MARK_NAMES[markName]).join(', ')}
      </>
    );
  }
  if (after.length) {
    return (
      <>
        <strong>Add format:</strong> {after.map((markName) => FORMAT_MARK_NAMES[markName]).join(', ')}
      </>
    );
  }
  return null;
}

function SidebarUser({ user }: { user?: Member }) {
  if (!user) return null;
  return <UserDisplay showMiniProfile userId={user.id} avatarSize='small' fontSize={14} fontWeight={500} />;
}

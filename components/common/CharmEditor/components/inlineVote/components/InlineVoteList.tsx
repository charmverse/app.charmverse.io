import type { Mark, MarkType, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { Box } from '@mui/system';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { NodeWithPos } from 'prosemirror-utils';
import { findChildrenByMark } from 'prosemirror-utils';
import { useEffect, useRef } from 'react';

import { Modal } from 'components/common/Modal';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useVotes } from 'hooks/useVotes';

import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { markName } from '../inlineVote.constants';
import type { InlineVotePluginState } from '../inlineVote.plugins';

import VoteDetail from './VoteDetail';

export default function InlineVoteList ({ pluginKey }: { pluginKey: PluginKey<InlineVotePluginState> }) {
  const view = useEditorViewContext();
  const {
    ids,
    show
  } = usePluginState(pluginKey) as InlineVotePluginState;
  const cardId = (new URLSearchParams(window.location.href)).get('cardId');
  const { currentPageActionDisplay } = usePageActionDisplay();
  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });
  const { votes, isLoading, isValidating, cancelVote, castVote, deleteVote } = useVotes();
  const inProgressVoteIds = ids.filter(voteId => votes[voteId]?.status === 'InProgress');

  // Using a ref so that its done only once
  const hasRemovedCompletedVoteMarks = useRef(false);

  useEffect(() => {
    if (!hasRemovedCompletedVoteMarks.current) {
      const votesList = Object.keys(votes);
      const notIsProgressVotes = new Set(votesList.filter(voteId => votes[voteId].status !== 'InProgress'));
      const completedVoteNodeWithMarks: (NodeWithPos & { mark: Mark })[] = [];
      if (!isValidating && votesList.length !== 0 && !isLoading) {
        const inlineVoteMarkSchema = view.state.schema.marks[markName] as MarkType;
        const inlineVoteNodes = findChildrenByMark(view.state.doc, inlineVoteMarkSchema);
        for (const inlineVoteNode of inlineVoteNodes) {
          // Find the inline vote mark for the node
          const inlineVoteMark = inlineVoteNode.node.marks.find(mark => mark.type.name === inlineVoteMarkSchema.name);
          // If the mark point to a vote that is not in progress, remove it from document
          if (inlineVoteMark && notIsProgressVotes.has(inlineVoteMark.attrs.id)) {
            completedVoteNodeWithMarks.push({
              ...inlineVoteNode,
              mark: inlineVoteMark
            });
          }
        }
        if (completedVoteNodeWithMarks.length !== 0) {
          let tr = view.state.tr;
          // Automatically remove marks for votes that are not in progress anymore
          completedVoteNodeWithMarks.forEach(inlineVoteNodeWithMark => {
            const from = inlineVoteNodeWithMark.pos;
            const to = from + inlineVoteNodeWithMark.node.nodeSize;
            tr = tr.removeMark(from, to, inlineVoteMarkSchema);
          });
          if (view.dispatch) {
            view.dispatch(tr);
          }
        }
        hasRemovedCompletedVoteMarks.current = true;
      }
    }
  }, [votes, isValidating, isLoading, view, hasRemovedCompletedVoteMarks]);

  if ((currentPageActionDisplay !== 'polls' || cardId) && show && inProgressVoteIds.length !== 0) {
    return (
      <Modal
        title='Poll details'
        size='large'
        open={true}
        onClose={() => {
          hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
          inlineVoteDetailModal.close();
        }}
      >
        {inProgressVoteIds.map(inProgressVoteId => (
          <Box mb={2} key={inProgressVoteId}>
            <VoteDetail
              cancelVote={cancelVote}
              castVote={castVote}
              deleteVote={deleteVote}
              vote={votes[inProgressVoteId]}
              detailed={true}
            />
          </Box>
        ))}
      </Modal>
    );
  }
  return null;
}

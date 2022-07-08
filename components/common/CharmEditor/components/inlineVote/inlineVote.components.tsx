import { Mark, MarkType, PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';

import { Box } from '@mui/system';
import { Modal } from 'components/common/Modal';
import CreateVoteModal from 'components/common/PageLayout/components/CreateVoteModal';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';
import { useEffect, useRef } from 'react';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageInlineVote from '../PageInlineVote';
import { markName } from './inlineVote.constants';
import { InlineVotePluginState } from './inlineVote.plugins';
import { updateInlineVote } from './inlineVote.utils';

export function InlineVoteList ({ pluginKey }: {pluginKey: PluginKey<InlineVotePluginState>}) {
  const view = useEditorViewContext();
  const {
    ids,
    show
  } = usePluginState(pluginKey) as InlineVotePluginState;

  const cardId = (new URLSearchParams(window.location.href)).get('cardId');
  const { currentPageActionDisplay } = usePageActionDisplay();
  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });
  const { inlineVotes, isValidating } = useInlineVotes();
  const inProgressVoteIds = ids.filter(voteId => inlineVotes[voteId]?.status === 'InProgress');

  // Using a ref so that its done only once
  const hasRemovedCompletedVoteMarks = useRef(false);

  useEffect(() => {
    if (!hasRemovedCompletedVoteMarks.current) {
      const inlineVotesList = Object.keys(inlineVotes);
      const inProgressVoteIdsSet = new Set(inlineVotesList.filter(voteId => inlineVotes[voteId].status === 'InProgress'));
      const completedVoteNodeWithMarks: (NodeWithPos & {mark: Mark})[] = [];
      if (!isValidating && inlineVotesList.length !== 0) {
        const inlineVoteMarkSchema = view.state.schema.marks[markName] as MarkType;
        const inlineVoteNodes = findChildrenByMark(view.state.doc, inlineVoteMarkSchema);
        for (const inlineVoteNode of inlineVoteNodes) {
          // Find the inline vote mark for the node
          const inlineVoteMark = inlineVoteNode.node.marks.find(mark => mark.type.name === inlineVoteMarkSchema.name);
          // If the mark point to a vote that is not in progress, remove it from document
          if (inlineVoteMark && !inProgressVoteIdsSet.has(inlineVoteMark.attrs.id)) {
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
  }, [inlineVotes, isValidating, view, hasRemovedCompletedVoteMarks]);

  if ((currentPageActionDisplay !== 'votes' || cardId) && show && inProgressVoteIds.length !== 0) {
    return (
      <Modal
        title='Votes details'
        size='large'
        open={true}
        onClose={() => {
          hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
          inlineVoteDetailModal.close();
        }}
      >
        {inProgressVoteIds.map(inProgressVoteId => (
          <Box mb={2}>
            <PageInlineVote inlineVote={inlineVotes[inProgressVoteId]} detailed />
          </Box>
        ))}
      </Modal>
    );
  }
  return null;
}

export function InlineVoteSubMenu ({ pluginKey }: { pluginKey: PluginKey }) {
  const view = useEditorViewContext();

  return (
    <CreateVoteModal
      onClose={() => {
        hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      }}
      postCreateVote={(vote) => {
        updateInlineVote(vote.id)(view.state, view.dispatch);
        hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
        const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
        view.dispatch(tr);
        view.focus();
      }}
    />
  );
}

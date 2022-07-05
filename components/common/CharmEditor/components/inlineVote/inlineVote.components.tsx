import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';

import { Box } from '@mui/system';
import { Modal } from 'components/common/Modal';
import CreateVoteModal from 'components/common/PageLayout/components/CreateVoteModal';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageInlineVote from '../PageInlineVote';
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
  const { inlineVotes } = useInlineVotes();
  const inProgressVoteIds = ids.filter(voteId => inlineVotes[voteId].status === 'InProgress');

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

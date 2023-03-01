import type { PluginKey } from '@bangle.dev/pm';
import { TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { selectionTooltip } from '@bangle.dev/tooltip';

import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';

import { updateInlineVote } from '../inlineVote.utils';

const { hideSelectionTooltip } = selectionTooltip;

export default function InlineVoteSubMenu({ pluginKey }: { pluginKey: PluginKey }) {
  const view = useEditorViewContext();

  return (
    <CreateVoteModal
      onClose={() => {
        hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      }}
      onCreateVote={(vote) => {
        updateInlineVote(vote.id)(view.state, view.dispatch);
        hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
        const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
        view.dispatch(tr);
        view.focus();
      }}
    />
  );
}

import { rafCommandExec } from '@bangle.dev/utils';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { hideSuggestionsTooltip } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import { replaceSuggestionMarkWith } from 'components/common/CharmEditor/components/inlinePalette/inlinePalette';
import { linkedPageNodeName } from 'components/common/CharmEditor/components/linkedPage/linkedPage.constants';
import { type LinkedPagePluginState } from 'components/common/CharmEditor/components/linkedPage/linkedPage.interfaces';

/**
 * Insert a nested page node in the editor view
 * @param pluginKey Plugin key which contains suggest tooltip key
 * @param view Editor view
 * @param pageId Page id to be linked with
 */
export function insertLinkedPage(
  pluginKey: PluginKey<LinkedPagePluginState>,
  view: EditorView,
  pageId: string,
  type: string,
  path: string
) {
  const { suggestTooltipKey } = pluginKey.getState(view.state) as LinkedPagePluginState;
  replaceSuggestionMarkWith(pluginKey, '', true)(view.state, view.dispatch, view);
  hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
  rafCommandExec(view, (state, dispatch) => {
    const nestedPageNode = state.schema.nodes[linkedPageNodeName].create({
      id: pageId,
      type,
      path
    });
    const tr = state.tr.replaceSelectionWith(nestedPageNode);
    if (dispatch) {
      dispatch(
        tr.setSelection(new TextSelection(tr.doc.resolve(tr.selection.$from.pos < 2 ? 1 : tr.selection.$from.pos - 2)))
      );
    }
    return true;
  });
}

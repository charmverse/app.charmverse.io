import { Command } from '@bangle.dev/pm';
import { suggestTooltip } from '@bangle.dev/tooltip';
import { SuggestPluginState } from 'lib/prosemirror/interfaces';
import { PluginKey } from 'prosemirror-state';

export function selectMention (key: PluginKey<SuggestPluginState>, mentionValue: string, mentionType: string): Command {
  return (state, dispatch, view) => {
    const mentionNode = state.schema.nodes.mention.create({
      value: mentionValue,
      type: mentionType
    });
    const suggestPluginState = key.getState(state);
    if (suggestPluginState) {
      const suggestTooltipKey = suggestPluginState.suggestTooltipKey;
      return suggestTooltip.replaceSuggestMarkWith(suggestTooltipKey, mentionNode)(
        state,
        dispatch,
        view
      );
    }
    return false;
  };
}

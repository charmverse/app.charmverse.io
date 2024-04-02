import type { Command, PluginKey } from 'prosemirror-state';
import { v4 } from 'uuid';

import type { SuggestPluginState } from 'lib/prosemirror/interfaces';

import { replaceSuggestMarkWith } from '../@bangle.dev/tooltip/suggestTooltip';
import { UserDataPluginKey } from '../charm/charm.plugins';

export function selectMention(key: PluginKey<SuggestPluginState>, mentionValue: string, mentionType: string): Command {
  return (state, dispatch, view) => {
    const charmPluginState = UserDataPluginKey.getState(state);
    if (charmPluginState) {
      const mentionNode = state.schema.nodes.mention.create({
        value: mentionValue,
        type: mentionType,
        id: v4(),
        createdAt: new Date(),
        createdBy: charmPluginState.userId
      });
      const suggestPluginState = key.getState(state);
      if (suggestPluginState) {
        const suggestTooltipKey = suggestPluginState.suggestTooltipKey;
        return replaceSuggestMarkWith(suggestTooltipKey, mentionNode)(state, dispatch, view);
      }
    }
    return false;
  };
}

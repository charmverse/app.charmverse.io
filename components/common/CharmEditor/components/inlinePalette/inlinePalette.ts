import type { Node } from 'prosemirror-model';
import type { Command, EditorState, PluginKey } from 'prosemirror-state';

import {
  queryIsSuggestTooltipActive,
  queryTriggerText,
  replaceSuggestMarkWith
} from '../@bangle.dev/tooltip/suggestTooltipSpec';

export const commands = {};

export function getSuggestTooltipKey(key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state)?.suggestTooltipKey as PluginKey | undefined;
  };
}

export function replaceSuggestionMarkWith(key: PluginKey, maybeNode?: string | Node, setSelection?: boolean): Command {
  return (state, dispatch, view) => {
    const suggestTooltipKey = getSuggestTooltipKey(key)(state);
    if (suggestTooltipKey) {
      return replaceSuggestMarkWith(suggestTooltipKey, maybeNode, setSelection)(state, dispatch, view);
    }
    return false;
  };
}

export function queryInlinePaletteActive(key: PluginKey) {
  return (state: EditorState) => {
    const suggestTooltipKey = getSuggestTooltipKey(key)(state);
    if (suggestTooltipKey) {
      return queryIsSuggestTooltipActive(suggestTooltipKey)(state);
    }
    return false;
  };
}

export function queryInlinePaletteText(key: PluginKey) {
  return (state: EditorState) => {
    const suggestTooltipKey = getSuggestTooltipKey(key)(state);
    if (suggestTooltipKey) {
      return queryTriggerText(suggestTooltipKey)(state);
    }
    return false;
  };
}

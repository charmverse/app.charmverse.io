import { log as _log } from '@charmverse/core/log';
import type { Command, EditorState, PluginKey } from 'prosemirror-state';

export const commands = {
  updateSelectionTooltipType,
  hideSelectionTooltip,
  queryIsSelectionTooltipActive,
  querySelectionTooltipType
};

const LOG = false;

const log = LOG ? _log.debug : () => {};

type SelectionType = string | null;

/** Commands  */

// This command will rerender if you call it with the type
// it already has. This is done in order to update the position of a tooltip.
export function updateSelectionTooltipType(key: PluginKey, type: SelectionType): Command {
  return (state, dispatch, _view) => {
    log('updateSelectionTooltipType', type);

    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function hideSelectionTooltip(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    log('hideSelectionTooltip');

    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type: null }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function queryIsSelectionTooltipActive(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);
    return !!(pluginState && typeof pluginState.type === 'string');
  };
}

export function querySelectionTooltipType(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);
    return pluginState && pluginState.type;
  };
}

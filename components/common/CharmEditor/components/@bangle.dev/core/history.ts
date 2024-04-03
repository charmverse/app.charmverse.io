import { createObject } from '@bangle.dev/utils';
import * as pmHistory from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import { PluginGroup } from './plugin-group';
import { type RawPlugins } from './plugin-loader';

export const plugins = pluginsFactory;
export const commands = {
  undo,
  redo
};
export const defaultKeys = {
  undo: 'Mod-z',
  redo: 'Mod-y',
  redoAlt: 'Shift-Mod-z'
};

const name = 'history';

function pluginsFactory({ historyOpts = {}, keybindings = defaultKeys } = {}): RawPlugins {
  return () => {
    return new PluginGroup(name, [
      pmHistory.history(historyOpts),
      keybindings &&
        keymap(
          createObject([
            [keybindings.undo, undo()],
            [keybindings.redo, redo()],
            [keybindings.redoAlt, redo()]
          ])
        )
    ]);
  };
}

export function undo() {
  return pmHistory.undo;
}
export function redo() {
  return pmHistory.redo;
}

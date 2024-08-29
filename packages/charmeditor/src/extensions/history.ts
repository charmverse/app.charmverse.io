import * as pmHistory from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import { type RawPlugins } from '../buildPlugins';

type HistoryOptions = {
  /**
  The amount of history events that are collected before the
  oldest events are discarded. Defaults to 100.
  */
  depth?: number;
  /**
  The delay between changes after which a new group should be
  started. Defaults to 500 (milliseconds). Note that when changes
  aren't adjacent, a new group is always started.
  */
  newGroupDelay?: number;
};

export function plugins(historyOpts: HistoryOptions = {}): RawPlugins {
  return () => {
    return [
      pmHistory.history(historyOpts),
      keymap({
        'Mod-z': pmHistory.undo,
        'Mod-y': pmHistory.redo,
        'Shift-Mod-z': pmHistory.redo
      })
    ];
  };
}

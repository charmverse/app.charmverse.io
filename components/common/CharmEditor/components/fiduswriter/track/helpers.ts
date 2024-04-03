import { PluginKey } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { getFromToMark } from '../state_plugins/track/getFromToMark';
import {
  selectedInsertionSpec,
  selectedDeletionSpec,
  selectedChangeFormatSpec,
  selectedChangeBlockSpec
} from '../state_plugins/track/plugin';

import type { TrackAttribute } from './interfaces';

export const key = new PluginKey('track');

export function deactivateAllSelectedChanges(tr: Transaction) {
  const pluginState = {
    decos: DecorationSet.empty
  };
  return tr.setMeta(key, pluginState).setMeta('track', true);
}

export function setSelectedChanges(state: EditorState, type: string, pos: number) {
  const tr = state.tr;
  const node = tr.doc.nodeAt(pos);
  if (!node) {
    return;
  }
  const mark = node.attrs.track
    ? node.attrs.track.find((t: TrackAttribute) => t.type === type)
    : node.marks.find((m) => m.type.name === type);
  if (!mark) {
    return;
  }
  const selectedChange = node.isInline ? getFromToMark(tr.doc, pos, mark) : { from: pos, to: pos + node.nodeSize };
  let decos = DecorationSet.empty;
  let spec;
  if (type === 'insertion') {
    spec = selectedInsertionSpec;
  } else if (type === 'deletion') {
    spec = selectedDeletionSpec;
  } else if (type === 'format_change') {
    spec = selectedChangeFormatSpec;
  } else if (type === 'block_change') {
    spec = selectedChangeBlockSpec;
  }
  const decoType = node.isInline ? Decoration.inline : Decoration.node;
  if (selectedChange) {
    decos = decos.add(tr.doc, [
      decoType(
        selectedChange.from,
        selectedChange.to,
        {
          class: `selected-${type}`
        },
        spec
      )
    ]);
  }
  return tr.setMeta(key, { decos }).setMeta('track', true);
}

// Check if selector matches one of the ancestors of the event target.
// Used in switch statements of document event listeners.
export function findTarget(event: MouseEvent, selector: string, el: { target?: Element | null } = {}) {
  el.target = (event.target as HTMLElement).closest(selector);
  if (el.target) {
    event.stopPropagation();
    return true;
  }
  return false;
}

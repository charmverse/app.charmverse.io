import { Decoration, DecorationSet } from '@bangle.dev/pm';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import scrollIntoView from 'scroll-into-view-if-needed';

import type { TrackAttribute } from '../../track/interfaces';

import { getFromToMark } from './getFromToMark';
import {
  key,
  selectedInsertionSpec,
  selectedDeletionSpec,
  selectedChangeFormatSpec,
  selectedChangeBlockSpec
} from './plugin';

export function activateTrack(view: EditorView, type: string, pos: number) {
  const tr = setSelectedChanges(view.state, type, pos);

  if (tr) {
    view.dispatch(tr);
    const selectedMark = view.domAtPos(pos).node as HTMLElement;
    if (selectedMark) {
      // use a library to scroll since charmeditor is inside a container element
      try {
        scrollIntoView(selectedMark, { scrollMode: 'if-needed', behavior: 'smooth' });
      } catch (err) {
        // sometimes invalid target when removing elements
      }
    }
  }
}

export function getSelectedChanges(state: EditorState) {
  const keyState = key.getState(state) as { decos: typeof DecorationSet.empty } | undefined;
  const decos = keyState?.decos ?? DecorationSet.empty;

  const insertion = decos.find(undefined, undefined, (spec) => spec === selectedInsertionSpec)[0];
  const deletion = decos.find(undefined, undefined, (spec) => spec === selectedDeletionSpec)[0];
  const formatChange = decos.find(undefined, undefined, (spec) => spec === selectedChangeFormatSpec)[0];
  const blockChange = decos.find(undefined, undefined, (spec) => spec === selectedChangeBlockSpec)[0];

  return { insertion, deletion, format_change: formatChange, block_change: blockChange };
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
  const decoType = node?.isInline ? Decoration.inline : Decoration.node;
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

export function deactivateAllSelectedChanges(tr: Transaction) {
  const pluginState = {
    decos: DecorationSet.empty
  };
  return tr.setMeta(key, pluginState).setMeta('track', true);
}

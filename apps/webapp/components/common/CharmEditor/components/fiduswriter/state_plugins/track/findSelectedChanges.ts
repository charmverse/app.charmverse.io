import type { Mark } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

import type { TrackAttribute } from '../../track/interfaces';

import { getFromToMark } from './getFromToMark';

type SelectedChange = { from: any; to: any } | null;
interface SelectedChanges {
  insertion: SelectedChange;
  deletion: SelectedChange;
  formatChange: SelectedChange;
}

export function findSelectedChanges(state: EditorState) {
  const selection = state.selection;
  const selectedChanges: SelectedChanges = { insertion: null, deletion: null, formatChange: null };
  let insertionPos: number = 0;
  let deletionPos: number = 0;
  let formatChangePos: number = 0;
  let insertionMark: Mark | undefined;
  let deletionMark: Mark | undefined;
  let formatChangeMark: Mark | undefined;
  let insertionSize;
  let deletionSize;
  let formatChangeSize;

  if (selection.empty) {
    const resolvedPos = state.doc.resolve(selection.from);
    const marks = resolvedPos.marks();
    if (marks) {
      insertionMark = marks.find((mark) => mark.type.name === 'insertion' && !mark.attrs.approved);
      if (insertionMark) {
        insertionPos = selection.from;
      }
      deletionMark = marks.find((mark) => mark.type.name === 'deletion');
      if (deletionMark) {
        deletionPos = selection.from;
      }
      formatChangeMark = marks.find((mark) => mark.type.name === 'format_change');
      if (formatChangeMark) {
        formatChangePos = selection.from;
      }
    }
  } else {
    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (pos < selection.from) {
        return true;
      }
      if (!insertionMark) {
        insertionMark = node.attrs.track
          ? node.attrs.track.find((t: TrackAttribute) => t.type === 'insertion')
          : node.marks.find((mark) => mark.type.name === 'insertion' && !mark.attrs.approved);
        if (insertionMark) {
          insertionPos = pos;
          if (!node.isInline) {
            insertionSize = node.nodeSize;
          }
        }
      }
      if (!deletionMark) {
        deletionMark = node.attrs.track
          ? node.attrs.track.find((t: TrackAttribute) => t.type === 'deletion')
          : node.marks.find((mark) => mark.type.name === 'deletion');
        if (deletionMark) {
          deletionPos = pos;
          if (!node.isInline) {
            deletionSize = node.nodeSize;
          }
        }
      }
      if (!formatChangeMark) {
        formatChangeMark = node.marks.find((mark) => mark.type.name === 'format_change');
        if (formatChangeMark) {
          formatChangePos = pos;
          if (!node.isInline) {
            formatChangeSize = node.nodeSize;
          }
        }
      }
    });
  }
  if (insertionMark) {
    selectedChanges.insertion = insertionSize
      ? { from: insertionPos, to: insertionPos + insertionSize }
      : getFromToMark(state.doc, insertionPos, insertionMark);
  }

  if (deletionMark) {
    selectedChanges.deletion = deletionSize
      ? { from: deletionPos, to: deletionPos + deletionSize }
      : getFromToMark(state.doc, deletionPos, deletionMark);
  }

  if (formatChangeMark) {
    selectedChanges.formatChange = formatChangeSize
      ? { from: formatChangePos, to: formatChangePos + formatChangeSize }
      : getFromToMark(state.doc, formatChangePos, formatChangeMark);
  }
  return selectedChanges;
}

import { Mapping, AddMarkStep, RemoveMarkStep } from '@bangle.dev/pm';
import type { EditorView } from 'prosemirror-view';

import { deleteNode } from './delete';
import { deactivateAllSelectedChanges } from './helpers';
import type { TrackAttribute } from './interfaces';

export function accept(type: string, pos: number, view: EditorView) {
  const tr = view.state.tr.setMeta('track', true);
  const map = new Mapping();
  let reachedEnd = false;
  const trackMark = view.state.doc.nodeAt(pos)?.marks.find((mark) => mark.type.name === type);
  view.state.doc.nodesBetween(pos, view.state.doc.nodeSize - 2, (node, nodePos) => {
    if (nodePos < pos) {
      return true;
    }
    if (reachedEnd) {
      return false;
    }
    if (!node.isInline) {
      reachedEnd = true;
    } else if (trackMark && !trackMark.isInSet(node.marks)) {
      reachedEnd = true;
      return false;
    }
    // Traverse only those nodes which have the track marks.
    if (trackMark === undefined || (trackMark && trackMark.isInSet(node.marks))) {
      if (type === 'deletion') {
        deleteNode(tr, node, nodePos, map, true);
      } else if (type === 'insertion') {
        if (node.attrs.track) {
          const track = node.attrs.track.filter((t: TrackAttribute) => t.type !== 'insertion');
          if (node.attrs.track.length === track) {
            return true;
          }
          tr.setNodeMarkup(map.map(nodePos), undefined, { ...node.attrs, track }, node.marks);
          // Special case: first paragraph in list item by same user -- will also be accepted.
          if (
            (node.type.name === 'listItem' || node.type.name === 'list_item') &&
            node.child(0) &&
            node.child(0).type.name === 'paragraph'
          ) {
            reachedEnd = false;
          }
        } else if (trackMark) {
          tr.step(
            new AddMarkStep(
              map.map(nodePos),
              map.map(nodePos + node.nodeSize),
              view.state.schema.marks.insertion.create({ ...trackMark.attrs, approved: true })
            )
          );
        }
      } else if (type === 'format_change') {
        if (trackMark) {
          tr.step(new RemoveMarkStep(map.map(nodePos), map.map(nodePos + node.nodeSize), trackMark));
        }
      } else if (type === 'block_change') {
        const track = node.attrs.track.filter((t: TrackAttribute) => t.type !== 'block_change');
        tr.setNodeMarkup(map.map(nodePos), undefined, { ...node.attrs, track }, node.marks);
      }
      return true;
    }
    return true;
  });

  deactivateAllSelectedChanges(tr);

  if (tr.steps.length) {
    view.dispatch(tr);
  }
}

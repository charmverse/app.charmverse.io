import { Mapping, AddMarkStep, RemoveMarkStep } from '@bangle.dev/pm';
import type { EditorView } from 'prosemirror-view';

import { deleteNode } from './delete';
import { deactivateAllSelectedChanges } from './helpers';
import type { TrackAttribute } from './interfaces';

export function reject(type: string, pos: number, view: EditorView) {
  const tr = view.state.tr.setMeta('track', true);
  const map = new Mapping();
  let reachedEnd = false;
  let inlineChange = false;
  const trackMark = view.state.doc?.nodeAt(pos)?.marks.find((mark) => mark.type.name === type);
  view.state.doc.nodesBetween(pos, view.state.doc.nodeSize - 2, (node, nodePos) => {
    if (nodePos < pos) {
      return true;
    }
    if (reachedEnd) {
      return false;
    }
    if (!node.isInline) {
      reachedEnd = true; // Changes on inline nodes are applied/reject until next non-inline node. Non-inline node changes are only applied that one node by default.
      if (inlineChange) {
        // Change has already affected inline node. Don't apply to block level.
        return false;
      }
    } else if (trackMark && !trackMark.isInSet(node.marks)) {
      reachedEnd = true;
      return false;
    } else {
      inlineChange = true;
    }
    if (type === 'insertion') {
      deleteNode(tr, node, nodePos, map, false);
    } else if (type === 'deletion') {
      if (node.attrs.track) {
        const track = node.attrs.track.filter((t: TrackAttribute) => t.type !== 'deletion');
        tr.setNodeMarkup(map.map(nodePos), undefined, { ...node.attrs, track }, node.marks);
        reachedEnd = true;
      } else {
        tr.removeMark(map.map(nodePos), map.map(nodePos + node.nodeSize), view.state.schema.marks.deletion);
      }
    } else if (type === 'format_change') {
      if (trackMark) {
        trackMark.attrs.before.forEach((oldMark: string) =>
          tr.step(
            new AddMarkStep(
              map.map(nodePos),
              map.map(nodePos + node.nodeSize),
              view.state.schema.marks[oldMark].create()
            )
          )
        );
        trackMark.attrs.after.forEach((newMark: string) => {
          tr.step(
            new RemoveMarkStep(
              map.map(nodePos),
              map.map(nodePos + node.nodeSize),
              node.marks.find((mark) => mark.type.name === newMark)!
            )
          );
        });
        tr.step(new RemoveMarkStep(map.map(nodePos), map.map(nodePos + node.nodeSize), trackMark));
      }
    } else if (type === 'block_change') {
      const blockChangeTrack = node.attrs.track?.find((t: TrackAttribute) => t.type === 'block_change');
      const track = node.attrs.track?.filter((t: TrackAttribute) => t !== blockChangeTrack);
      if (!blockChangeTrack) {
        return true;
      }
      tr.setNodeMarkup(
        map.map(nodePos),
        view.state.schema.nodes[blockChangeTrack.before.type],
        { ...node.attrs, ...blockChangeTrack.before.attrs, track },
        node.marks
      );
    }
    return true;
  });

  deactivateAllSelectedChanges(tr);

  if (tr.steps.length) {
    view.dispatch(tr);
  }
}

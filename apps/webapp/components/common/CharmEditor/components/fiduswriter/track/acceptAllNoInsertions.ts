import type { Node, Transaction } from '@bangle.dev/pm';
import { Mapping, Mark, RemoveMarkStep, Transform } from '@bangle.dev/pm';

import { deleteNode } from './delete';
import type { TrackAttribute } from './interfaces';

export function acceptAllNoInsertions(doc: Node) {
  const tr = new Transform(doc);
  const map = new Mapping();
  doc.descendants((node, pos) => {
    const trackAttr: TrackAttribute[] | undefined = node.attrs.track;

    const deletionTrack = trackAttr
      ? trackAttr.find((t) => t.type === 'deletion')
      : node.marks.find((mark) => mark.type.name === 'deletion');
    const insertionTrack = trackAttr
      ? trackAttr.find((t) => t.type === 'insertion')
      : node.marks.find((mark) => mark.type.name === 'insertion');
    const formatChangeMark = node.marks.find((mark) => mark.type.name === 'format_change');
    const blockChangeTrack = trackAttr ? trackAttr.find((t) => t.type === 'block_change') : false;

    if (deletionTrack) {
      deleteNode(tr as Transaction, node, pos, map, true);
      return false;
    } else if (insertionTrack) {
      if (node.isInline && insertionTrack instanceof Mark) {
        tr.step(new RemoveMarkStep(map.map(pos), map.map(pos + node.nodeSize), insertionTrack));
      } else {
        const track = trackAttr?.filter((t) => t !== insertionTrack) ?? [];
        tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
      }
    }
    if (node.isInline && formatChangeMark) {
      tr.step(new RemoveMarkStep(map.map(pos), map.map(pos + node.nodeSize), formatChangeMark));
    }
    if (blockChangeTrack) {
      const track = trackAttr?.filter((t) => t !== blockChangeTrack) ?? [];
      tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
    }
    return true;
  });
  return tr.doc;
}

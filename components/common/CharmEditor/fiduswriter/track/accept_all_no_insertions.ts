import type { Node } from '@bangle.dev/pm';
import { Mapping, RemoveMarkStep, Transform } from '@bangle.dev/pm';

import { deleteNode } from './delete';

export function acceptAllNoInsertions (doc: Node) {
  const tr = new Transform(doc); const
    map = new Mapping();
  doc.descendants((node, pos) => {
    const deletionTrack = node.attrs.track
      ? node.attrs.track.find(t => t.type === 'deletion')
      : node.marks.find(mark => mark.type.name === 'deletion');
    const insertionTrack = node.attrs.track
      ? node.attrs.track.find(t => t.type === 'insertion')
      : node.marks.find(mark => mark.type.name === 'insertion');
    const formatChangeMark = node.marks.find(mark => mark.type.name === 'format_change');
    const blockChangeTrack = node.attrs.track
      ? node.attrs.track.find(t => t.name === 'block_change')
      : false;

    if (deletionTrack) {
      deleteNode(tr, node, pos, map, true);
      return false;
    }
    else if (insertionTrack) {
      if (node.isInline) {
        tr.step(
          new RemoveMarkStep(
            map.map(pos),
            map.map(pos + node.nodeSize),
            insertionTrack
          )
        );
      }
      else {
        const track = node.attrs.track.filter(t => t !== insertionTrack);
        tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
      }
    }
    if (node.isInline && formatChangeMark) {
      tr.step(
        new RemoveMarkStep(
          map.map(pos),
          map.map(pos + node.nodeSize),
          formatChangeMark
        )
      );
    }
    if (blockChangeTrack) {
      const track = node.attrs.track.filter(t => t.type !== blockChangeTrack);
      tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
    }
    return true;
  });
  return tr.doc;
}

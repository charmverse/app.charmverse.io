import { Slice } from 'prosemirror-model';
import { Mapping, AddMarkStep, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';

import { deleteNode } from './delete';
import { deactivateAllSelectedChanges } from './helpers';
import type { TrackAttribute } from './interfaces';

export function acceptAll(view: EditorView, from = 0, to = 0) {
  if (!to) {
    to = view.state.doc.content.size;
  }
  const tr = view.state.tr.setMeta('track', true);
  const map = new Mapping();
  view.state.doc.nodesBetween(from, to, (node, pos) => {
    if (pos < from && !node.isInline) {
      return true;
    }
    let deletedNode = false;

    const trackAttr: TrackAttribute[] | undefined = node.attrs.track;

    if (trackAttr?.find((t) => t.type === 'deletion')) {
      deleteNode(tr, node, pos, map, true);
      deletedNode = true;
    } else if (node.marks?.find((mark) => mark.type.name === 'deletion')) {
      const delStep = new ReplaceStep(
        map.map(Math.max(pos, from)),
        map.map(Math.min(pos + node.nodeSize, to)),
        Slice.empty
      );
      tr.step(delStep);
      map.appendMap(delStep.getMap());
      deletedNode = true;
    } else if (trackAttr?.find((t) => t.type === 'insertion')) {
      const track = trackAttr.filter((t) => t.type !== 'insertion');
      tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
    } else if (node.marks?.find((mark) => mark.type.name === 'insertion' && !mark.attrs.approved)) {
      const mark = node.marks.find((m) => m.type.name === 'insertion');
      const attrs = { ...mark?.attrs, approved: true };
      tr.step(
        new AddMarkStep(
          map.map(Math.max(pos, from)),
          map.map(Math.min(pos + node.nodeSize, to)),
          view.state.schema.marks.insertion.create(attrs)
        )
      );
    }
    const formatChangeMark = node.marks.find((mark) => mark.type.name === 'format_change');
    if (node.isInline && !deletedNode && formatChangeMark) {
      tr.step(
        new RemoveMarkStep(map.map(Math.max(pos, from)), map.map(Math.min(pos + node.nodeSize, to)), formatChangeMark)
      );
    }

    if (!node.isInline && !deletedNode && trackAttr) {
      const blockChangeTrack = trackAttr.find((t) => t.type === 'block_change');
      if (blockChangeTrack) {
        const track = trackAttr.filter((t) => t !== blockChangeTrack);
        tr.setNodeMarkup(map.map(pos), undefined, { ...node.attrs, track }, node.marks);
      }
    }

    return true;
  });

  deactivateAllSelectedChanges(tr);

  if (tr.steps.length) {
    view.dispatch(tr);
  }
}

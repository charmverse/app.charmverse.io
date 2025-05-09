import type { Mapping, Node, Transaction } from '@bangle.dev/pm';
import {
  ReplaceStep,
  ReplaceAroundStep,
  replaceStep,
  Slice,
  Selection,
  TextSelection,
  EditorState,
  liftListItem
} from '@bangle.dev/pm';

import type { TrackAttribute } from './interfaces';

export function deleteNode(tr: Transaction, node: Node, nodePos: number, map: Mapping, accept: boolean) {
  // Delete a node either because a deletion has been accepted or an insertion rejected.
  const newNodePos = map.map(nodePos);
  const trackType = accept ? 'deletion' : 'insertion';
  let delStep;
  if (node.isTextblock) {
    const selectionBefore = Selection.findFrom(tr.doc.resolve(newNodePos), -1);
    if (selectionBefore instanceof TextSelection) {
      const start = selectionBefore.$anchor.pos;
      const end = newNodePos + 1;
      let allowMerge = true;
      // Make sure there is no isolating nodes inbetween.
      tr.doc.nodesBetween(start, end, (_node, pos) => {
        if (pos < start) {
          return true;
        }
        if (_node.type.spec.isolating) {
          allowMerge = false;
        }
      });
      if (allowMerge) {
        delStep = replaceStep(tr.doc, start, end);
      } else {
        const track = node.attrs.track.filter((t: TrackAttribute) => t.type !== trackType);
        tr.setNodeMarkup(newNodePos, undefined, { ...node.attrs, track }, node.marks);
      }
    } else {
      // There is a block node right in front of it that cannot be removed. Give up. (table/figure/etc.)
      const track = node.attrs.track.filter((t: TrackAttribute) => t.type !== trackType);
      tr.setNodeMarkup(newNodePos, undefined, { ...node.attrs, track }, node.marks);
    }
  } else if (node.isLeaf || ['figure', 'table'].includes(node.type.name)) {
    delStep = new ReplaceStep(newNodePos, map.map(nodePos + node.nodeSize), Slice.empty);
  } else if (node.type === tr.doc.type.schema.nodes.listItem || node.type === tr.doc.type.schema.nodes.list_item) {
    const state = EditorState.create({
      doc: tr.doc,
      selection: Selection.findFrom(tr.doc.resolve(newNodePos), 1) || undefined
    });
    liftListItem(node.type)(state, (newTr) => {
      newTr.steps.forEach((step) => {
        tr.step(step);
        map.appendMap(step.getMap());
      });
    });
  } else {
    const end = map.map(nodePos + node.nodeSize);
    delStep = new ReplaceAroundStep(newNodePos, end, newNodePos + 1, end - 1, Slice.empty, 0, true);
  }
  if (delStep) {
    tr.step(delStep);
    const stepMap = delStep.getMap();
    map.appendMap(stepMap);
  }
}

import type { Node, Mark } from 'prosemirror-model';

// From https://discuss.prosemirror.net/t/expanding-the-selection-to-the-active-mark/478/2 with some bugs fixed
export function getFromToMark(doc: Node, pos: number, mark: Mark) {
  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  const start = parent.childAfter($pos.parentOffset);
  if (!start.node) {
    return null;
  }
  let startIndex: number = $pos.index();
  let startPos: number = $pos.start() + start.offset;
  while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
    // eslint-disable-next-line no-plusplus
    startPos -= parent.child(--startIndex).nodeSize;
  }
  let endIndex: number = $pos.index() + 1;
  let endPos: number = $pos.start() + start.offset + start.node.nodeSize;
  while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
    // eslint-disable-next-line no-plusplus
    endPos += parent.child(endIndex++).nodeSize;
  }
  return { from: startPos, to: endPos };
}

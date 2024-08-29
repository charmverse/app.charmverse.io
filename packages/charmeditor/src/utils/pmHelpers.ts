import type { MarkType, Node, NodeType, ResolvedPos, Schema } from 'prosemirror-model';
import { Fragment, Slice } from 'prosemirror-model';
import { Selection, EditorState } from 'prosemirror-state';
import type { Command } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { assertNotUndefined } from './jsUtils';

export abstract class GapCursorSelection extends Selection {}

type PredicateFunction = (state: EditorState, view?: EditorView) => any;

export function filter(predicates: PredicateFunction | PredicateFunction[], cmd?: Command): Command {
  return (state, dispatch, view) => {
    if (cmd == null) {
      return false;
    }
    if (!Array.isArray(predicates)) {
      predicates = [predicates];
    }
    if (predicates.some((pred) => !pred(state, view))) {
      return false;
    }
    return cmd(state, dispatch, view) || false;
  };
}

// This will return (depth - 1) for root list parent of a list.
export const getListLiftTarget = (type: NodeType | null | undefined, schema: Schema, resPos: ResolvedPos): number => {
  let target = resPos.depth;
  const { bulletList, orderedList } = schema.nodes;
  let listItem = type;
  if (!listItem) {
    ({ listItem } = schema.nodes);
  }

  for (let i = resPos.depth; i > 0; i--) {
    const node = resPos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      target = i;
    }
    if (node.type !== bulletList && node.type !== orderedList && node.type !== listItem) {
      break;
    }
  }
  return target - 1;
};

export function isMarkActiveInSelection(type: MarkType): (state: EditorState) => boolean {
  return (state) => {
    const { from, $from, to, empty } = state.selection;
    if (empty) {
      return Boolean(type.isInSet(state.tr.storedMarks || $from.marks()));
    }
    return Boolean(state.doc.rangeHasMark(from, to, type));
  };
}

export function mapChildren<T>(
  node: Node | Fragment,
  callback: (child: Node, index: number, frag: Fragment) => T
): T[] {
  const array = [];
  for (let i = 0; i < node.childCount; i++) {
    array.push(callback(node.child(i), i, node instanceof Fragment ? node : node.content));
  }

  return array;
}

type MapFragmentCallback = (node: Node, parent: Node | undefined, index: number) => Node | Node[] | Fragment | null;

export function mapSlice(slice: Slice, callback: MapFragmentCallback) {
  const fragment = mapFragment(slice.content, callback);
  return new Slice(fragment, slice.openStart, slice.openEnd);
}

export function mapFragment(
  content: Fragment,
  callback: MapFragmentCallback,
  parent?: Node
  /*: (
    node: Node,
    parent: Node | null,
    index: number,
  ) => Node | Node[] | Fragment | null, */
): Fragment {
  const children = [];
  for (let i = 0, size = content.childCount; i < size; i++) {
    const node = content.child(i);
    const transformed = node.isLeaf
      ? callback(node, parent, i)
      : callback(node.copy(mapFragment(node.content, callback, node)), parent, i);
    if (transformed) {
      if (transformed instanceof Fragment) {
        children.push(...getFragmentBackingArray(transformed));
      } else if (Array.isArray(transformed)) {
        children.push(...transformed);
      } else {
        children.push(transformed);
      }
    }
  }
  return Fragment.fromArray(children);
}

export function getFragmentBackingArray(fragment: Fragment) {
  // @ts-ignore @types/prosemirror-model doesn't have Fragment.content
  return fragment.content;
}

export const isEmptySelectionAtStart = (state: EditorState) => {
  const { empty, $from } = state.selection;
  return empty && ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection);
};

export function nodeAtSafe(doc: Node, pos: number): Node | null {
  if (pos < 0 || pos > doc.content.size) {
    // Exit here or error will be thrown:
    // e.g. RangeError: Position outside of fragment.
    return null;
  }
  return doc.nodeAt(pos);
}

/**
 * Gets the node type from the schema
 * Warning: This will throw if the node type is not found
 * @param arg
 * @param name
 * @returns
 */
export function getNodeType(arg: Schema | EditorState, name: string): NodeType {
  const nodeType = arg instanceof EditorState ? arg.schema.nodes[name] : arg.nodes[name];
  assertNotUndefined(nodeType, `nodeType ${name} not found`);
  return nodeType;
}

export function isAtBeginningOfLine(state: EditorState) {
  const { empty, $from } = state.selection;
  return empty && ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection);
}

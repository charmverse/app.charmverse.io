import type { Command, EditorState, Node, NodeRange, NodeType, ResolvedPos, Schema, Transaction } from '@bangle.dev/pm';
import {
  autoJoin,
  Fragment,
  liftListItem,
  liftTarget,
  NodeSelection,
  ReplaceAroundStep,
  Selection,
  Slice,
  TextSelection,
  wrapInList as pmWrapInList,
  sinkListItem
} from '@bangle.dev/pm';
import type { MoveDirection } from '@bangle.dev/pm-commands';
import {
  compose,
  extendDispatch,
  filter,
  findCutBefore,
  findParentNode,
  findParentNodeOfType,
  findPositionOfNodeBefore,
  flatten,
  GapCursorSelection,
  hasParentNodeOfType,
  hasVisibleContent,
  isEmptySelectionAtStart,
  isFirstChildOfParent,
  isNodeEmpty,
  isRangeOfType,
  safeInsert,
  sanitiseSelectionMarksForWrapping,
  validListParent,
  validPos
} from '@bangle.dev/utils';
import { chainCommands } from 'prosemirror-commands';

import { isNodeTodo, removeTodoCheckedAttr, setTodoCheckedAttr } from './todo';
import { liftFollowingList, liftSelectionList } from './transforms';

const maxIndentation = 15;

// Returns the number of nested lists that are ancestors of the given selection
const numberNestedLists = (resolvedPos: ResolvedPos, nodes: Schema['nodes']) => {
  const { bulletList, orderedList } = nodes;
  let count = 0;
  for (let i = resolvedPos.depth - 1; i > 0; i--) {
    const node = resolvedPos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      count += 1;
    }
  }
  return count;
};

const isInsideList = (state: EditorState, listType: NodeType) => {
  const { $from } = state.selection;
  const parent = $from.node(-2);
  const grandGrandParent = $from.node(-3);

  return (parent && parent.type === listType) || (grandGrandParent && grandGrandParent.type === listType);
};

const canOutdent = (type?: NodeType) => (state: EditorState) => {
  const { parent } = state.selection.$from;
  let listItem = type;
  if (!listItem) {
    ({ listItem } = state.schema.nodes);
  }
  const { paragraph } = state.schema.nodes;

  if (state.selection instanceof GapCursorSelection) {
    return parent.type === listItem;
  }

  return parent.type === paragraph && hasParentNodeOfType(listItem!)(state.selection);
};

/**
 * Check if we can sink the list.
 * @returns {boolean} - true if we can sink the list
 *                    - false if we reach the max indentation level
 */
function canSink(initialIndentationLevel: number, state: EditorState) {
  /*
      - Keep going forward in document until indentation of the node is < than the initial
      - If indentation is EVER > max indentation, return true and don't sink the list
      */
  let currentIndentationLevel: number | null;
  let currentPos = state.tr.selection.$to.pos;
  do {
    const resolvedPos = state.doc.resolve(currentPos);
    currentIndentationLevel = numberNestedLists(resolvedPos, state.schema.nodes);
    if (currentIndentationLevel > maxIndentation) {
      // Cancel sink list.
      // If current indentation less than the initial, it won't be
      // larger than the max, and the loop will terminate at end of this iteration
      return false;
    }
    currentPos += 1;
  } while (currentIndentationLevel >= initialIndentationLevel);
  return true;
}

export const isInsideListItem = (type: NodeType) => (state: EditorState) => {
  const { $from } = state.selection;

  let listItem = type;
  if (!listItem) {
    ({ listItem } = state.schema.nodes);
  }
  const { paragraph } = state.schema.nodes;
  if (state.selection instanceof GapCursorSelection) {
    return $from.parent.type === listItem;
  }
  return hasParentNodeOfType(listItem)(state.selection) && $from.parent.type === paragraph;
};

// Get the depth of the nearest ancestor list
const rootListDepth = (type: NodeType, pos: ResolvedPos, nodes: Schema['nodes']) => {
  const listItem = type;

  const { bulletList, orderedList } = nodes;
  let depth: number | null;
  for (let i = pos.depth - 1; i > 0; i--) {
    const node = pos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      depth = i;
    }
    if (node.type !== bulletList && node.type !== orderedList && node.type !== listItem) {
      break;
    }
  }
  return depth!;
};

function canToJoinToPreviousListItem(state: EditorState) {
  const { $from } = state.selection;
  const { bulletList, orderedList } = state.schema.nodes;
  const $before = state.doc.resolve($from.pos - 1);
  let nodeBefore = $before ? $before.nodeBefore : null;
  if (state.selection instanceof GapCursorSelection) {
    nodeBefore = $from.nodeBefore;
  }
  return !!nodeBefore && [bulletList, orderedList].indexOf(nodeBefore.type) > -1;
}

/**
 * ------------------
 * Command Factories
 * ------------------
 */

/**
 *
 * @param {Object} listType  bulletList, orderedList,
 * @param {Object} itemType   'listItem'
 * @param {boolean} todo if true and the final result of toggle is a bulletList
 *                      set `todoChecked` attr for each listItem.
 */
export function toggleList(listType: NodeType, itemType?: NodeType, todo?: boolean): Command {
  return (state, dispatch, view) => {
    const { selection } = state;
    const fromNode = selection.$from.node(selection.$from.depth - 2);
    const endNode = selection.$to.node(selection.$to.depth - 2);
    if (!fromNode || fromNode.type.name !== listType.name || !endNode || endNode.type.name !== listType.name) {
      return toggleListCommand(listType, todo)(state, dispatch, view);
    } else {
      // If current ListType is the same as `listType` in arg,
      // toggle the list to `p`.
      const listItem = itemType || state.schema.nodes.listItem;

      const depth = rootListDepth(listItem, selection.$to, state.schema.nodes);

      let liftFrom = selection.$to.pos;

      // I am not fully sure the best solution,
      // but if we donot handle the nodeSelection of itemType
      // an incorrect content error in thrown by liftFollowingList.
      if (selection instanceof NodeSelection && selection.node.type === listItem) {
        liftFrom = selection.$from.pos + selection.node.firstChild!.content.size;
      }

      const baseTr = state.tr;
      let tr = liftFollowingList(listItem, state, liftFrom, selection.$to.end(depth), depth || 0, baseTr);

      tr = liftSelectionList(listItem, state, tr);
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  };
}

function toggleListCommand(listType: NodeType, todo: boolean = false): Command {
  /**
   * A function which will set todoChecked attribute
   * in any of the nodes that have modified on the tr
   */
  const setTodoListTr = (schema: Schema) => (tr: Transaction) => {
    if (!tr.isGeneric) {
      return tr;
    }
    // The following code gets a list of ranges that were changed
    // From wrapDispatchForJoin: https://github.com/prosemirror/prosemirror-commands/blob/e5f8c303be55147086bfe4521cf7419e6effeb8f/src%2Fcommands.js#L495
    // and https://discuss.prosemirror.net/t/finding-out-what-changed-in-a-transaction/2372
    const ranges: number[] = [];
    for (let i = 0; i < tr.mapping.maps.length; i++) {
      const map = tr.mapping.maps[i];
      for (let j = 0; j < ranges.length; j++) {
        ranges[j] = map.map(ranges[j]);
      }
      map.forEach((_s, _e, from, to) => {
        ranges.push(from, to);
      });
    }

    const canBeTodo = (node: Node, parentNode: Node | null) =>
      node.type === schema.nodes.listItem && parentNode?.type === schema.nodes.bulletList;

    for (let i = 0; i < ranges.length; i += 2) {
      const from = ranges[i];
      const to = ranges[i + 1];

      tr.doc.nodesBetween(from, to, (node, pos, parentNode) => {
        if (pos >= from && pos < to && canBeTodo(node, parentNode)) {
          setTodoCheckedAttr(tr, schema, node, pos);
        }
      });
    }

    return tr;
  };

  return function (state, dispatch, view) {
    if (dispatch) {
      dispatch(state.tr.setSelection(adjustSelectionInList(state.doc, state.selection)));
    }

    if (!view) {
      return false;
    }

    state = view.state;

    const { $from, $to } = state.selection;
    const isRangeOfSingleType = isRangeOfType(state.doc, $from, $to, listType);

    if (isInsideList(state, listType) && isRangeOfSingleType) {
      return liftListItems()(state, dispatch);
    } else {
      // Converts list type e.g. bulletList -> orderedList if needed
      if (!isRangeOfSingleType) {
        liftListItems()(state, dispatch);
        state = view.state;
      }

      // Remove any invalid marks that are not supported
      const tr = sanitiseSelectionMarksForWrapping(state, listType);
      if (tr && dispatch) {
        dispatch(tr);
        state = view.state;
      }

      // Wraps selection in list
      return wrapInList(listType)(state, todo ? extendDispatch(dispatch, setTodoListTr(state.schema)) : dispatch);
    }
  };
}

function wrapInList(nodeType: NodeType, attrs?: Node['attrs']): Command {
  return autoJoin(
    pmWrapInList(nodeType, attrs),
    (before, after) => before.type === after.type && before.type === nodeType
  );
}

function liftListItems(): Command {
  return function (state, dispatch) {
    const { tr } = state;
    const { $from, $to } = state.selection;

    tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      // Following condition will ensure that block types paragraph, heading, codeBlock, blockquote, panel are lifted.
      // isTextblock is true for paragraph, heading, codeBlock.
      if (node.isTextblock) {
        const sel = new NodeSelection(tr.doc.resolve(tr.mapping.map(pos)));
        const range = sel.$from.blockRange(sel.$to);

        if (!range || ![state.schema.nodes.listItem].includes(sel.$from.parent.type)) {
          return false;
        }

        const target = range && liftTarget(range);

        if (target === undefined || target === null) {
          return false;
        }

        tr.lift(range, target);
      }
    });

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}

/**
 * Sometimes a selection in the editor can be slightly offset, for example:
 * it's possible for a selection to start or end at an empty node at the very end of
 * a line. This isn't obvious by looking at the editor and it's likely not what the
 * user intended - so we need to adjust the selection a bit in scenarios like that.
 */
function adjustSelectionInList(doc: Node, selection: Selection) {
  const { $from, $to } = selection;

  const isSameLine = $from.pos === $to.pos;

  let startPos = $from.pos;
  const endPos = $to.pos;

  if (isSameLine && startPos === doc.nodeSize - 3) {
    // Line is empty, don't do anything
    return selection;
  }

  // Selection started at the very beginning of a line and therefor points to the previous line.
  if ($from.nodeBefore && !isSameLine) {
    startPos += 1;
    let node = doc.nodeAt(startPos);
    while (!node || (node && !node.isText)) {
      startPos += 1;
      node = doc.nodeAt(startPos);
    }
  }

  if (endPos === startPos) {
    return new TextSelection(doc.resolve(startPos));
  }

  return new TextSelection(doc.resolve(startPos), doc.resolve(endPos));
}

export function indentList(type: NodeType) {
  const handleTodo = (schema: Schema) => (tr: Transaction) => {
    if (!tr.isGeneric) {
      return tr;
    }

    const range = tr.selection.$from.blockRange(
      tr.selection.$to,
      (node) => node.childCount > 0 && node.firstChild!.type === schema.nodes.listItem
    );

    if (
      !range ||
      // we donot have an existing node to check if todo is needed or not
      range.startIndex === 0
    ) {
      return tr;
    }

    const isNodeBeforeATodo = isNodeTodo(range.parent.child(range.startIndex - 1), schema);

    const { parent, startIndex, endIndex } = range;

    let offset = 0;
    for (let i = startIndex; i < endIndex; i++) {
      const child = parent.child(i);

      const pos = range.start + offset;

      tr = isNodeBeforeATodo
        ? setTodoCheckedAttr(tr, schema, child, pos)
        : removeTodoCheckedAttr(tr, schema, child, pos);

      offset += child.nodeSize;
    }
    return tr;
  };

  return function indentListCommand(state: EditorState, dispatch?: (tr: Transaction) => void) {
    let listItem = type;
    if (!listItem) {
      ({ listItem } = state.schema.nodes);
    }
    if (isInsideListItem(listItem)(state)) {
      // Record initial list indentation
      const initialIndentationLevel = numberNestedLists(state.selection.$from, state.schema.nodes);
      if (canSink(initialIndentationLevel, state)) {
        const { paragraph } = state.schema.nodes;

        const { $from, $to } = state.selection;

        // Step 1: The current selection is in Item 2 paragraph
        if ($from.node().type === paragraph) {
          // Step 2: Go to its parent node and find the 2nd child (orderedList)
          const parentListItem = $from.node($from.depth - 1);
          if (parentListItem.childCount > 1) {
            const childOrderedList = parentListItem.child(1);

            const nodes: Node[] = [];
            childOrderedList.content.forEach((child) => {
              const node = state.schema.nodeFromJSON(child.toJSON());
              nodes.push(node);
            });
            const itemType = state.schema.nodes.listItem;

            // Step 3: Copy the content of orderedList
            // Step 4: Create a new list of the following structure
            const fragment = Fragment.fromArray([
              state.schema.nodes.listItem.create(undefined, parentListItem.child(0)),
              ...nodes
            ]);

            // Based on https://github.com/ProseMirror/prosemirror-schema-list/blob/master/src/schema-list.ts#LL219C47-L219C47
            const range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild?.type === itemType);
            if (!range) return false;
            const startIndex = range.startIndex;
            if (startIndex === 0) {
              if (range.$from.pos === range.$to.pos) {
                // Regular indentation
                return false;
              }
              // Multi line selection, thus assume indentation
              return true;
            }
            const parent = range.parent;
            const nodeBefore = parent.child(startIndex - 1);
            if (nodeBefore.type !== itemType) return false;
            if (dispatch) {
              const nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type === parent.type;
              const inner = Fragment.from(nestedBefore ? itemType.create() : null);
              const slice = new Slice(
                Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
                nestedBefore ? 3 : 1,
                0
              );
              const before = range.start;
              const after = range.end;
              // Combine the transactions together (indenting the list + leveling the children list items), which was not possible in sinkListItem
              let tr = state.tr
                .step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true))
                .replace(
                  $from.start($from.depth - 1) - (nestedBefore ? 3 : 1),
                  $from.end($from.depth - 1),
                  new Slice(fragment, fragment.firstChild ? 0 : 1, fragment.lastChild ? 0 : 1)
                );
              // Retain the previous selection
              tr = tr.setSelection(TextSelection.create(tr.doc, $from.start() - 2));
              // Step 5: Replace the whole listItem node with the above fragment
              dispatch(tr);
            }

            return true;
          } else {
            const sinkedListItem = sinkListItem(listItem)(state, extendDispatch(dispatch, handleTodo(state.schema)));
            if (!sinkedListItem) {
              if ($from.pos === $to.pos) {
                // Regular indentation
                return false;
              }
              // Multi line selection, thus assume indentation
              return true;
            }
            return true;
          }
        }

        return false;
      }
      return true;
    }
    return false;
  };
}

export function outdentList(type: NodeType): Command {
  return function (state, dispatch, view) {
    let listItem = type;
    if (!listItem) {
      ({ listItem } = state.schema.nodes);
    }
    const { $from, $to } = state.selection;
    if (!isInsideListItem(listItem)(state)) {
      return false;
    }
    // if we're backspacing at the start of a list item, unindent it
    // take the range of nodes we might be lifting

    // the predicate is for when you're backspacing a top level list item:
    // we don't want to go up past the doc node, otherwise the range
    // to clear will include everything
    const range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild!.type === listItem);

    if (!range) {
      return false;
    }

    const isGreatGrandTodo = isNodeTodo(state.selection.$from.node(-3), state.schema);

    // TODO this is not quite as lean as the indent approach of todo
    // check if we need to set todoCheck attribute
    if (dispatch && view) {
      const grandParent = state.selection.$from.node(-2);
      const grandParentPos = state.selection.$from.start(-2);
      const tr = state.tr;
      for (const { node, pos } of flatten(grandParent, false)) {
        const absPos = pos + grandParentPos;

        // -1 so that we cover the entire list item
        if (absPos >= state.selection.$from.before(-1) && absPos < state.selection.$to.after(-1)) {
          if (isGreatGrandTodo) {
            setTodoCheckedAttr(tr, state.schema, node, absPos);
          } else {
            removeTodoCheckedAttr(tr, state.schema, node, absPos);
          }
        }
      }
      dispatch(tr);
      state = view.state;
    }

    const composedCommand = compose(
      mergeLists(listItem, range), // 2. Check if I need to merge nearest list
      liftListItem // 1. First lift list item
    )(listItem);

    return composedCommand(state, dispatch, view);
  };
}

/**
 * Merge closest bullet list blocks into one
 *
 * @param {NodeType} listItem
 * @param {NodeRange} range
 * @returns
 */
function mergeLists(listItem: NodeType, range: NodeRange): (command: Command) => Command {
  return (command: Command) => {
    return (state, dispatch, view) => {
      const newDispatch = (tr: Transaction) => {
        /* we now need to handle the case that we lifted a sublist out,
         * and any listItems at the current level get shifted out to
         * their own new list; e.g.:
         *
         * unorderedList
         *  listItem(A)
         *  listItem
         *    unorderedList
         *      listItem(B)
         *  listItem(C)
         *
         * becomes, after unindenting the first, top level listItem, A:
         *
         * content of A
         * unorderedList
         *  listItem(B)
         * unorderedList
         *  listItem(C)
         *
         * so, we try to merge these two lists if they're of the same type, to give:
         *
         * content of A
         * unorderedList
         *  listItem(B)
         *  listItem(C)
         */
        const $start = state.doc.resolve(range.start);
        const $end = state.doc.resolve(range.end);
        const $join = tr.doc.resolve(tr.mapping.map(range.end - 1));
        if ($join.nodeBefore && $join.nodeAfter && $join.nodeBefore.type === $join.nodeAfter.type) {
          if ($end.nodeAfter && $end.nodeAfter.type === listItem && $end.parent.type === $start.parent.type) {
            tr.join($join.pos);
          }
        }
        if (dispatch) {
          dispatch(tr.scrollIntoView());
        }
      };
      return command(state, newDispatch, view);
    };
  };
}

// Chaining runs each command until one of them returns true
export const backspaceKeyCommand =
  (type: NodeType): Command =>
  (state, dispatch, view) => {
    return chainCommands(
      // if we're at the start of a list item, we need to either backspace
      // directly to an empty list item above, or outdent this node
      filter(
        [
          isInsideListItem(type),
          isEmptySelectionAtStart,

          // list items might have multiple paragraphs; only do this at the first one
          isFirstChildOfParent,
          canOutdent(type)
        ],
        chainCommands(deletePreviousEmptyListItem(type), outdentList(type))
      ),

      // if we're just inside a paragraph node (or gapcursor is shown) and backspace, then try to join
      // the text to the previous list item, if one exists
      filter([isEmptySelectionAtStart, canToJoinToPreviousListItem], joinToPreviousListItem(type))
    )(state, dispatch, view);
  };

export function enterKeyCommand(type: NodeType): Command {
  return (state, dispatch, view) => {
    const { selection } = state;
    if (selection.empty) {
      const { $from } = selection;
      let listItem = type;
      if (!listItem) {
        ({ listItem } = state.schema.nodes);
      }
      const { codeBlock } = state.schema.nodes;

      const node = $from.node($from.depth);
      const wrapper = $from.node($from.depth - 1);
      if (wrapper && wrapper.type === listItem) {
        /** Check if the wrapper has any visible content */
        const wrapperHasContent = hasVisibleContent(wrapper);
        if (isNodeEmpty(node) && !wrapperHasContent) {
          const grandParent = $from.node($from.depth - 3);
          // To allow for cases where a non-todo item is nested inside a todo item
          // pressing enter should convert that type into a todo listItem and outdent.
          if (isNodeTodo(grandParent, state.schema) && !isNodeTodo(wrapper, state.schema)) {
            return outdentList(state.schema.nodes.listItem)(state, dispatch, view);
          } else {
            return outdentList(listItem)(state, dispatch, view);
          }
        } else if (!hasParentNodeOfType(codeBlock)(selection)) {
          return splitListItem(listItem, (_node) => {
            if (!isNodeTodo(node, state.schema)) {
              return _node.attrs;
            }
            return {
              ..._node.attrs,
              todoChecked: false
            };
          })(state, dispatch);
        }
      }
    }
    return false;
  };
}

/** *
 * Implementation taken from PM and mk-2
 * Splits the list items, specific implementation take from PM
 *
 * splitAttrs(node): attrs - if defined the new split item will get attrs returned by this.
 *                        where node is the currently active node.
 */
function splitListItem(itemType: NodeType, splitAttrs?: (node: Node) => Node['attrs']): Command {
  return function (state, dispatch) {
    const ref = state.selection;
    const $from = ref.$from;
    const $to = ref.$to;
    const node: Node | null = (ref as any).node;
    if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
      return false;
    }
    const grandParent = $from.node(-1);
    if (grandParent.type !== itemType) {
      return false;
    }
    /** --> The following line changed from the original PM implementation to allow list additions with multiple paragraphs */
    if (
      // @ts-ignore Fragment.content is missing in @types/prosemirror-model
      grandParent.content.content.length <= 1 &&
      $from.parent.content.size === 0 &&
      !(grandParent.content.size === 0)
    ) {
      // In an empty block. If this is a nested list, the wrapping
      // list item should be split. Otherwise, bail out and let next
      // command handle lifting.
      if ($from.depth === 2 || $from.node(-3).type !== itemType || $from.index(-2) !== $from.node(-2).childCount - 1) {
        return false;
      }
      if (dispatch) {
        let wrap = Fragment.empty;
        const keepItem = $from.index(-1) > 0;
        // Build a fragment containing empty versions of the structure
        // from the outer list item to the parent node of the cursor
        for (let d = $from.depth - (keepItem ? 1 : 2); d >= $from.depth - 3; d--) {
          wrap = Fragment.from($from.node(d).copy(wrap));
        }
        // Add a second list item with an empty default start node
        wrap = wrap.append(Fragment.from(itemType.createAndFill()!));
        const tr$1 = state.tr.replace(
          $from.before(keepItem ? undefined : -1),
          $from.after(-3),
          new Slice(wrap, keepItem ? 3 : 2, 2)
        );
        tr$1.setSelection(Selection.near(tr$1.doc.resolve($from.pos + (keepItem ? 3 : 2))));
        dispatch(tr$1.scrollIntoView());
      }
      return true;
    }
    const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt(0).defaultType : undefined;
    const tr = state.tr.delete($from.pos, $to.pos);
    const types = [
      splitAttrs ? { type: itemType, attrs: splitAttrs(grandParent) } : undefined,
      nextType && { type: nextType }
    ];
    if (dispatch) {
      dispatch(tr.split($from.pos, 2, types as any).scrollIntoView());
    }
    return true;
  };
}

function joinToPreviousListItem(type?: NodeType): Command {
  return (state, dispatch) => {
    let listItem = type;
    if (!listItem) {
      ({ listItem } = state.schema.nodes);
    }

    const { $from } = state.selection;
    const { paragraph, codeBlock, heading, bulletList, orderedList } = state.schema.nodes;
    const isGapCursorShown = state.selection instanceof GapCursorSelection;
    const $cutPos = isGapCursorShown ? state.doc.resolve($from.pos + 1) : $from;
    const $cut = findCutBefore($cutPos);
    if (!$cut) {
      return false;
    }

    // see if the containing node is a list
    if ($cut.nodeBefore && [bulletList, orderedList].indexOf($cut.nodeBefore.type) > -1) {
      // and the node after this is a paragraph / codeBlock / heading
      if ($cut.nodeAfter && [paragraph, codeBlock, heading].indexOf($cut.nodeAfter.type) > -1) {
        // find the nearest paragraph that precedes this node
        let $lastNode = $cut.doc.resolve($cut.pos - 1);

        while ($lastNode.parent.type !== paragraph) {
          $lastNode = state.doc.resolve($lastNode.pos - 1);
        }

        let { tr } = state;
        if (isGapCursorShown) {
          const nodeBeforePos = findPositionOfNodeBefore(tr.selection);
          if (typeof nodeBeforePos !== 'number') {
            return false;
          }
          // append the paragraph / codeblock / heading to the list node
          const list = $cut.nodeBefore.copy(
            $cut.nodeBefore.content.append(Fragment.from(listItem!.createChecked({}, $cut.nodeAfter)!))
          );
          tr.replaceWith(nodeBeforePos, $from.pos + $cut.nodeAfter.nodeSize, list);
        } else {
          // take the text content of the paragraph and insert after the paragraph up until before the cut
          tr = tr.step(
            new ReplaceAroundStep(
              $lastNode.pos,
              $cut.pos + $cut.nodeAfter.nodeSize,
              $cut.pos + 1,
              $cut.pos + $cut.nodeAfter.nodeSize - 1,
              state.tr.doc.slice($lastNode.pos, $cut.pos),
              0,
              true
            )
          );
        }

        // find out if there's now another list following and join them
        // as in, [list, p, list] => [list with p, list], and we want [joined list]
        const $postCut = tr.doc.resolve(tr.mapping.map($cut.pos + $cut.nodeAfter.nodeSize));
        if (
          $postCut.nodeBefore &&
          $postCut.nodeAfter &&
          $postCut.nodeBefore.type === $postCut.nodeAfter.type &&
          [bulletList, orderedList].indexOf($postCut.nodeBefore.type) > -1
        ) {
          tr = tr.join($postCut.pos);
        }

        if (dispatch) {
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }

    return false;
  };
}

function deletePreviousEmptyListItem(type: NodeType): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    let listItem = type;
    if (!listItem) {
      ({ listItem } = state.schema.nodes);
    }
    const $cut = findCutBefore($from);
    if (!$cut || !$cut.nodeBefore || !($cut.nodeBefore.type === listItem)) {
      return false;
    }

    const previousListItemEmpty = $cut.nodeBefore.childCount === 1 && $cut.nodeBefore.firstChild!.nodeSize <= 2;
    if (previousListItemEmpty) {
      const { tr } = state;
      if (dispatch) {
        dispatch(tr.delete($cut.pos - $cut.nodeBefore.nodeSize, $from.pos).scrollIntoView());
      }
      return true;
    }
    return false;
  };
}

export function moveEdgeListItem(type: NodeType, dir: MoveDirection = 'UP'): Command {
  const isDown = dir === 'DOWN';
  const isItemAtEdge = (state: EditorState) => {
    const currentResolved = findParentNodeOfType(type)(state.selection);
    if (!currentResolved) {
      return false;
    }
    const currentNode = currentResolved.node;
    const { $from } = state.selection;
    const parent = $from.node(currentResolved.depth - 1);
    const matchedChild = parent && parent[isDown ? 'lastChild' : 'firstChild'];

    if (currentNode && matchedChild === currentNode) {
      return true;
    }

    return false;
  };

  const command: Command = (state, dispatch, view) => {
    let listItem = type;

    if (!listItem) {
      ({ listItem } = state.schema.nodes);
    }

    if (!state.selection.empty) {
      return false;
    }

    const grandParent = findParentNode((node) => validListParent(node.type, state.schema.nodes))(state.selection);
    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!(grandParent && grandParent.node) || !(parent && parent.node)) {
      return false;
    }

    // outdent if the not nested list item i.e. top level
    if (state.selection.$from.depth === 3) {
      return outdentList(listItem)(state, dispatch, view);
    }

    // If there is only one element, we need to delete the entire
    // bulletList/orderedList so as not to leave any empty list behind.
    const nodeToRemove = grandParent.node.childCount === 1 ? grandParent : parent;
    const tr = state.tr.delete(nodeToRemove.pos, nodeToRemove.pos + nodeToRemove.node.nodeSize);

    // - first // doing a (-1) will move us to end of 'first' hence allowing us to add an item
    // - second  // start(-3) will give 11 which is the start of this listItem,
    //   - third{<>}
    let insertPos = state.selection.$from.before(-3);

    // when going down move the position by the size of remaining content (after deletion)
    if (isDown) {
      const uncleNodePos = state.selection.$from.after(-3);
      insertPos = uncleNodePos - nodeToRemove.node.nodeSize;
      const uncle = validPos(uncleNodePos, state.doc) && state.doc.nodeAt(uncleNodePos);

      if (uncle && uncle.type === listItem) {
        // Example
        // - first
        // - second
        //   - third{<>}
        // - uncle
        // {x} <== you want to go down here
        insertPos += uncle.nodeSize;
      }
    }

    const nodeToInsert = parent.node;

    const newTr = safeInsert(nodeToInsert, insertPos)(tr);
    // no change hence dont mutate anything
    if (newTr === tr) {
      return false;
    }
    if (dispatch) {
      dispatch(newTr);
    }
    return true;
  };

  return filter([isItemAtEdge], command);
}

export function updateNodeAttrs(type: NodeType, cb: (attrs: Node['attrs']) => Node['attrs']): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    const current = $from.node(-1);
    if (current && current.type === type) {
      const { tr } = state;
      const nodePos = $from.before(-1);
      const newAttrs = cb(current.attrs);
      if (newAttrs !== current.attrs) {
        tr.setNodeMarkup(nodePos, undefined, cb(current.attrs));
        if (dispatch) {
          dispatch(tr);
        }
        return true;
      }
    }
    return false;
  };
}

export function queryNodeAttrs(type: NodeType) {
  return (state: EditorState) => {
    const { $from } = state.selection;
    const current = $from.node(-1);
    if (current && current.type === type) {
      return current.attrs;
    }
    return false;
  };
}

import { autoJoin } from 'prosemirror-commands';
import { Fragment, Slice, NodeRange } from 'prosemirror-model';
import type { Node, NodeType, Schema } from 'prosemirror-model';
import { TextSelection, EditorState } from 'prosemirror-state';
import type { Selection, Transaction } from 'prosemirror-state';
import { liftTarget, ReplaceAroundStep } from 'prosemirror-transform';

import { getListLiftTarget, mapChildren, mapSlice } from '../../utils/pmHelpers';

function liftListItem(type: NodeType, state: EditorState, selection: Selection, tr: Transaction) {
  const { $from, $to } = selection;
  let listItem = type;
  if (!listItem) {
    ({ list_item: listItem } = state.schema.nodes);
  }

  let range = $from.blockRange(
    $to,
    (node) => !!node.childCount && !!node.firstChild && node.firstChild.type === listItem
  );
  if (!range || range.depth < 2 || $from.node(range.depth - 1).type !== listItem) {
    return tr;
  }
  const end = range.end;
  const endOfList = $to.end(range.depth);
  if (end < endOfList) {
    tr.step(
      new ReplaceAroundStep(
        end - 1,
        endOfList,
        end,
        endOfList,
        new Slice(Fragment.from(listItem.create(undefined, range.parent.copy())), 1, 0),
        1,
        true
      )
    );
    range = new NodeRange(tr.doc.resolve($from.pos), tr.doc.resolve(endOfList), range.depth);
  }
  return tr.lift(range, liftTarget(range)!).scrollIntoView();
}
// Function will lift list item following selection to level-1.
export function liftFollowingList(
  type: NodeType,
  state: EditorState,
  from: number,
  to: number,
  rootListDepth: number,
  tr: Transaction
) {
  let listItem = type;
  if (!listItem) {
    ({ list_item: listItem } = state.schema.nodes);
  }
  let lifted = false;
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (!lifted && node.type === listItem && pos > from) {
      lifted = true;
      let listDepth = rootListDepth + 3;
      while (listDepth > rootListDepth + 2) {
        const start = tr.doc.resolve(tr.mapping.map(pos));
        listDepth = start.depth;

        const end = tr.doc.resolve(tr.mapping.map(pos + node.content.size));
        const sel = new TextSelection(start, end);
        tr = liftListItem(listItem, state, sel, tr);
      }
    }
  });
  return tr;
}
// The function will list paragraphs in selection out to level 1 below root list.
export function liftSelectionList(type: NodeType | undefined, state: EditorState, tr: Transaction) {
  const { from, to } = state.selection;
  const { paragraph } = state.schema.nodes;
  const listCol: { node: Node; pos: number }[] = [];
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === paragraph) {
      listCol.push({ node, pos });
    }
  });
  for (let i = listCol.length - 1; i >= 0; i--) {
    const _paragraph = listCol[i];
    const start = tr.doc.resolve(tr.mapping.map(_paragraph.pos));
    if (start.depth > 0) {
      let end;

      if (_paragraph.node.textContent && _paragraph.node.textContent.length > 0) {
        end = tr.doc.resolve(tr.mapping.map(_paragraph.pos + _paragraph.node.textContent.length));
      } else {
        end = tr.doc.resolve(tr.mapping.map(_paragraph.pos + 1));
      }
      const range = start.blockRange(end);
      if (range) {
        tr.lift(range, getListLiftTarget(type, state.schema, start));
      }
    }
  }
  return tr;
}
// matchers for text lists
const bullets = /^\s*[*\-\u2022](\s*|$)/;
const numbers = /^\s*\d[.)](\s*|$)/;
const getListType = (node: Node, schema: Schema): [NodeType, number] | null => {
  if (!node.text) {
    return null;
  }
  const { bullet_list: bulletList, ordered_list: orderedList } = schema.nodes;
  return [
    {
      node: bulletList,
      matcher: bullets
    },
    {
      node: orderedList,
      matcher: numbers
    }
  ].reduce((lastMatch: [NodeType, number] | null, listType) => {
    if (lastMatch) {
      return lastMatch;
    }
    const match = node.text!.match(listType.matcher);
    return match ? [listType.node, match[0].length] : lastMatch;
  }, null);
};
const extractListFromParagaph = (type: NodeType, node: Node, schema: Schema) => {
  const { hardBreak, bullet_list: bulletList, ordered_list: orderedList } = schema.nodes;
  const content = mapChildren(node.content, (_node) => _node);
  const listTypes = [bulletList, orderedList];
  // wrap each line into a listItem and a containing list
  const listified = content
    .map((child) => {
      const listMatch = getListType(child, schema);
      if (!listMatch || !child.text) {
        return child;
      }
      const [nodeType, length] = listMatch;
      // convert to list item
      const newText = child.text.substr(length);
      let listItem = type;
      if (!listItem) {
        ({ listItem } = schema.nodes);
      }

      const listItemNode = listItem.createAndFill(
        undefined,
        schema.nodes.paragraph.createChecked(undefined, newText.length ? schema.text(newText) : undefined)
      );
      if (!listItemNode) {
        return child;
      }
      return nodeType.createChecked(undefined, [listItemNode]);
    })
    .filter((child, idx, arr) => {
      // remove hardBreaks that have a list node on either side
      // wasn't hardBreak, leave as-is
      if (child.type !== hardBreak) {
        return child;
      }
      if (idx > 0 && listTypes.indexOf(arr[idx - 1].type) > -1) {
        // list node on the left
        return null;
      }
      if (idx < arr.length - 1 && listTypes.indexOf(arr[idx + 1].type) > -1) {
        // list node on the right
        return null;
      }
      return child;
    });
  // try to join
  const mockState = EditorState.create({
    schema
  });
  let lastTr: Transaction | undefined;
  const mockDispatch = (tr: Transaction) => {
    lastTr = tr;
  };
  autoJoin(
    (state, dispatch) => {
      if (!dispatch) {
        return false;
      }
      dispatch(state.tr.replaceWith(0, 2, listified));
      return true;
    },
    () => true
  )(mockState, mockDispatch);
  const fragment = lastTr ? lastTr.doc.content : Fragment.from(listified);
  // try to re-wrap fragment in paragraph (which is the original node we unwrapped)
  const { paragraph } = schema.nodes;
  if (paragraph.validContent(fragment)) {
    return Fragment.from(paragraph.create(node.attrs, fragment, node.marks));
  }
  // fragment now contains other nodes, get Prosemirror to wrap with ContentMatch later
  return fragment;
};
/**
 * Walks the slice, creating paragraphs that were previously separated by hardbreaks.
 * @param slice
 * @param schema
 * @returns the original paragraph node (as a fragment), or a fragment containing multiple nodes
 */
const splitIntoParagraphs = (fragment: Fragment, schema: Schema) => {
  const paragraphs = [];
  let curChildren: Node[] = [];
  let lastNode: Node | null = null;
  const { hardBreak, paragraph } = schema.nodes;
  fragment.forEach((node) => {
    if (lastNode && lastNode.type === hardBreak && node.type === hardBreak) {
      // double hardbreak
      // backtrack a little; remove the trailing hardbreak we added last loop
      curChildren.pop();
      // create a new paragraph
      paragraphs.push(paragraph.createChecked(undefined, curChildren));
      curChildren = [];
      return;
    }
    // add to this paragraph
    curChildren.push(node);
    lastNode = node;
  });
  if (curChildren.length) {
    paragraphs.push(paragraph.createChecked(undefined, curChildren));
  }
  return Fragment.from(paragraphs.length ? paragraphs : [paragraph.createAndFill()!]);
};
export const splitParagraphs = (slice: Slice, schema: Schema) => {
  // exclude Text nodes with a code mark, since we transform those later
  // into a codeblock
  let hasCodeMark = false;
  slice.content.forEach((child) => {
    hasCodeMark = hasCodeMark || child.marks.some((mark) => mark.type === schema.marks.code);
  });
  // slice might just be a raw text string
  if (schema.nodes.paragraph.validContent(slice.content) && !hasCodeMark) {
    const replSlice = splitIntoParagraphs(slice.content, schema);
    return new Slice(replSlice, slice.openStart + 1, slice.openEnd + 1);
  }
  return mapSlice(slice, (node) => {
    if (node.type === schema.nodes.paragraph) {
      return splitIntoParagraphs(node.content, schema);
    }
    return node;
  });
};
// above will wrap everything in paragraphs for us
export const upgradeTextToLists = (type: NodeType, slice: Slice, schema: Schema) => {
  return mapSlice(slice, (node) => {
    if (node.type === schema.nodes.paragraph) {
      return extractListFromParagaph(type, node, schema);
    }
    return node;
  });
};

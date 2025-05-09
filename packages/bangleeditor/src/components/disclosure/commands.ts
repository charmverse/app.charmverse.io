import { findParentNodeOfTypeClosestToPos } from '@bangle.dev/utils';
import { Fragment } from 'prosemirror-model';
import type { Node } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { Command } from 'prosemirror-state';

// Backspace Use case: When a user hits 'backspace' at the beginning of a summary node
// Action: Remove the disclosure node
// Command: Grab all the child nodes inside summary and details, then replace
// the disclosure range with the children.
export const backspaceCmd: Command = (state, dispatch) => {
  const { tr } = state;
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const { $cursor } = state.selection;
  if (!$cursor) {
    return false;
  }

  const summaryNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureSummary);
  const disclosureNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureDetails);
  const nextNodePos = $cursor.after();
  const nextNode = state.doc.nodeAt(nextNodePos);
  // If the cursor is at the paragraph (#) node and the next sibling is a disclosureDetails node
  if (nextNode && nextNode.type === state.schema.nodes.disclosureDetails) {
    const paragraphNode = $cursor.parent;
    const paragraphIsEmpty = paragraphNode.textContent.length === 0;

    // If the paragraph is empty, delete the paragraph node
    if (paragraphIsEmpty) {
      const paragraphStart = $cursor.before();
      const paragraphEnd = $cursor.after();
      tr.delete(paragraphStart, paragraphEnd);

      if (dispatch) {
        dispatch(tr);
      }

      return true;
    }
  }

  // if we are inside a summary node and at the beginning, delete the disclosure
  if ($cursor.parentOffset === 0 && disclosureNode && summaryNode) {
    const nodes: Node[] = [];

    summaryNode.node.descendants((node) => {
      nodes.push(node);
      return false;
    });

    disclosureNode.node.descendants((node) => {
      if (node.type.name !== 'disclosureSummary') {
        nodes.push(node);
      }
      return false;
    });

    const disclosureStart = disclosureNode.pos;
    const disclosureEnd = disclosureStart + disclosureNode.node.nodeSize;
    const nakedNodes = tr.doc.copy(Fragment.from(nodes));
    tr.replaceWith(disclosureStart, disclosureEnd, nakedNodes);
    // try to set cursor to first node, doesnt seem to work in FF
    tr.setSelection(new TextSelection(tr.doc.resolve(disclosureNode.pos)));
    if (dispatch) {
      dispatch(tr);
    }

    return true;
  }
  return false;
};

export const moveDownCmd: Command = (state, dispatch, view) => {
  let { tr } = state;
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const { $cursor } = state.selection;
  const summaryNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureSummary);
  const detailsNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureDetails);
  // Must be in summary node for enter to take effect
  if (detailsNode && summaryNode && view) {
    const summaryDomNode = view.domAtPos(summaryNode.pos).node as HTMLDivElement;
    summaryDomNode.setAttribute('open', '');
    const emptyParagraphNode = state.schema.nodes.paragraph.create();
    const summaryNodePosition = tr.doc.resolve(detailsNode.pos + summaryNode.node.nodeSize);
    tr = tr.setSelection(new TextSelection(summaryNodePosition)).replaceSelectionWith(emptyParagraphNode, false);
    tr.setSelection(new TextSelection(tr.doc.resolve(detailsNode.pos + summaryNode.node.nodeSize)));
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  }
  return false;
};

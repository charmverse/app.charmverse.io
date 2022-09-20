
import type { Command, Node } from '@bangle.dev/pm';
import { Fragment, TextSelection } from '@bangle.dev/pm';
import { findParentNodeOfTypeClosestToPos } from '@bangle.dev/utils';

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

  // if we are inside a summary node and at the beginning, delete the disclosure
  if ($cursor.parentOffset === 0 && disclosureNode && summaryNode) {
    const nodes: Node[] = [];

    summaryNode.node.descendants(node => {
      nodes.push(node);
      return false;
    });

    disclosureNode.node.descendants(node => {
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

// TODO: we should move cursor to the content section when hitting Enter

// export const moveDownCmd: Command = (state, dispatch) => {
//   const { tr } = state;
//   // @ts-ignore types package is missing $cursor property as of 1.2.8
//   const { $cursor } = state.selection;
//   const summaryNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureSummary);
//   console.log('hit enter', !!summaryNode);
//   if (summaryNode) {
//     console.log('move cursor down', tr.doc.resolve(summaryNode.pos + summaryNode.node.nodeSize + 1));
//     tr.setSelection(new TextSelection(tr.doc.resolve(summaryNode.pos + summaryNode.node.nodeSize + 1)));
//     if (dispatch) {
//       dispatch(tr);
//     }
//     return true;
//   }
//   return false;
// };

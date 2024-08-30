import type { NodeType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';

// Finds a parent node in the ancestors and check if that node has a direct parent of type `parentsParentType`
export function parentHasDirectParentOfType(
  parentType: NodeType,
  parentsParentType: NodeType | NodeType[]
): (state: EditorState) => boolean {
  parentsParentType = Array.isArray(parentsParentType) ? parentsParentType : [parentsParentType];

  return (state) => {
    const currentResolved = findParentNodeOfType(parentType)(state.selection);
    if (!currentResolved) {
      return false;
    }

    const depth = currentResolved.depth - 1;
    if (depth < 0) {
      return false;
    }
    const parentsParent = state.selection.$from.node(depth);

    return (parentsParentType as NodeType[]).includes(parentsParent.type);
  };
}

import { Command, EditorState, Schema, toggleMark } from '@bangle.dev/pm';
import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';
import { highlightDomElement } from 'lib/browser';
import { markName } from './inlineComment.constants';

const getTypeFromSchema = (schema: Schema) => schema.marks[markName];

export function toggleInlineComment (): Command {
  return (state, dispatch) => {
    return toggleMark(getTypeFromSchema(state.schema))(state, dispatch);
  };
}

export function queryIsInlineCommentActive () {
  return (state: EditorState) => isMarkActiveInSelection(getTypeFromSchema(state.schema))(state);
}

export function createInlineComment () {
  return filter(
    (state) => queryIsInlineCommentAllowedInRange(
      state.selection.$from.pos,
      state.selection.$to.pos
    )(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const inlineCommentMark = state.schema.marks['inline-comment'];
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const createdInlineCommentMark = state.schema.marks['inline-comment'].create({
        id: null
      });
      tr.addMark(from, to, createdInlineCommentMark);

      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  );
}

function isTextAtPos (pos: number) {
  return (state: EditorState) => {
    const node = state.doc.nodeAt(pos);
    return !!node && (node.isText || node.type.name.match(/(emoji|mention)/));
  };
}

function setInlineComment (from: number, to: number, id?: string) {
  return filter(
    (state) => isTextAtPos(from)(state),
    (state, dispatch) => {
      const inlineCommentMark = state.schema.marks['inline-comment'];
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const mark = state.schema.marks['inline-comment'].create({
        id
      });
      tr.addMark(from, to, mark);
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  );
}

export function updateInlineComment (id: string): Command {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return setInlineComment(
        state.selection.$from.pos,
        state.selection.$to.pos,
        id
      )(state, dispatch);
    }

    const { $from } = state.selection;
    const pos = $from.pos - $from.textOffset;
    const node = state.doc.nodeAt(pos);
    let to = pos;

    if (node) {
      to += node.nodeSize;
    }

    return setInlineComment(pos, to, id)(state, dispatch);
  };
}

export function queryIsInlineCommentAllowedInRange (from: number, to: number) {
  return (state: EditorState) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const inlineCommentMark = state.schema.marks['inline-comment'];
    if ($from.parent === $to.parent && $from.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(inlineCommentMark);
    }
  };
}

export function queryIsSelectionAroundInlineComment () {
  return (state: EditorState) => {
    const { $from, $to } = state.selection;
    const node = $from.nodeAfter;

    return (
      !!node
      && $from.textOffset === 0
      && $to.pos - $from.pos === node.nodeSize
      // Id will be available after the thread has been created
      && !node.marks.find(mark => mark?.type?.name === markName)?.attrs.id
      && !!state.doc.type.schema.marks['inline-comment'].isInSet(node.marks)
    );
  };
}

export function scrollToThread (threadId: string) {
  // Find the inline-comment with the threadId and scroll into view
  const threadDocument = document.getElementById(`inline-comment.${threadId}`);
  if (threadDocument) {
    let parentElement: HTMLElement | null = null;
    let element: HTMLElement | null = threadDocument;
    // Check for highest 5 levels of depth
    for (let i = 0; i < 5; i++) {
      element = threadDocument.parentElement;
      // Get the first paragraph parent element
      if (element?.classList.contains('bangle-nv-content')) {
        parentElement = element;
        break;
      }
    }

    requestAnimationFrame(() => {
      threadDocument.scrollIntoView({
        behavior: 'smooth'
      });
    });

    setTimeout(() => {
      if (parentElement) {
        // Need to create a custom element as adding styling to prosemirror-node isn't possible
        const highlightElement = document.createElement('div');
        document.body.appendChild(highlightElement);
        const boundingRect = parentElement.getBoundingClientRect();
        // Set the location of the custom element
        highlightElement.style.top = `${boundingRect.top}px`;
        highlightElement.style.left = `${boundingRect.left}px`;
        highlightElement.style.width = `${boundingRect.width}px`;
        highlightElement.style.height = `${boundingRect.height}px`;
        highlightElement.style.position = 'absolute';
        highlightDomElement(highlightElement, () => {
          // Remove the custom element after the highlighting is done
          document.body.removeChild(highlightElement);
        });
      }
    }, 500);
  }
}

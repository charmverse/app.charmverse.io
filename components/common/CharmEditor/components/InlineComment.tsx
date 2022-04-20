import { RawSpecs } from '@bangle.dev/core';
import { Schema, DOMOutputSpec, Command, toggleMark, EditorState } from '@bangle.dev/pm';
import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';

const name = 'inline-comment';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

export function highlightSpec (): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'span.charm-inline-comment'
        }
      ],
      toDOM: (): DOMOutputSpec => ['span', { class: 'charm-inline-comment' }]
    },
    markdown: {
      // TODO: Fix convert to markdown
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true
      },
      parseMarkdown: {
        strong: { mark: name }
      }
    }
  };
}

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
      const linkMark = state.schema.marks.link;
      const tr = state.tr.removeMark(from, to, linkMark);
      const inlineCommentMark = state.schema.marks['inline-comment'].create({
        id: null
      });
      tr.addMark(from, to, inlineCommentMark);

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
    return !!node && node.isText;
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
      && !!state.doc.type.schema.marks['inline-comment'].isInSet(node.marks)
    );
  };
}


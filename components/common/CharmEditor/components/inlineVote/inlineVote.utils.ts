import { EditorState } from '@bangle.dev/pm';
import { filter } from '@bangle.dev/utils';
import { markName } from './inlineVote.constants';

const getMarkFromState = (state: EditorState) => state.schema.marks[markName];

export function queryIsInlineVoteAllowedInRange (from: number, to: number) {
  return (state: EditorState) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const inlineVoteMark = getMarkFromState(state);
    if ($from.parent === $to.parent && $from.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(inlineVoteMark);
    }
  };
}

export function createInlineVote () {
  return filter(
    (state) => queryIsInlineVoteAllowedInRange(
      state.selection.$from.pos,
      state.selection.$to.pos
    )(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const inlineVoteMark = getMarkFromState(state);
      const tr = state.tr.removeMark(from, to, inlineVoteMark);
      const createdInlineVoteMark = inlineVoteMark.create({
        id: null
      });
      tr.addMark(from, to, createdInlineVoteMark);

      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  );
}

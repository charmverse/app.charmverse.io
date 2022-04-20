import { PageContent } from 'models';
import { safeInsert } from '@bangle.dev/utils';
import { EditorState, Node, Transaction } from '@bangle.dev/pm';

export function checkForEmpty (content: PageContent | null) {
  return !content?.content
  || content.content.length === 0
  || (content.content.length === 1
      // These nodes dont contain any content so there is no content field
      && !content.content[0]?.type.match(/(cryptoPrice|columnLayout|image|iframe|mention|page)/)
      && (!content.content[0].content?.length));
}

export function insertNode (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, nodeToInsert: Node) {
  const insertPos = state.selection.$from.after();

  const tr = state.tr;
  const newTr = safeInsert(nodeToInsert, insertPos)(state.tr);

  if (tr === newTr) {
    return false;
  }

  if (dispatch) {
    dispatch(newTr.scrollIntoView());
  }

  return true;
}

import { EditorViewContext } from '@bangle.dev/react';
import { TextSelection } from 'prosemirror-state';
import { useContext } from 'react';
import styled from '@emotion/styled';

const Component = styled.div`
  cursor: text;
  width: 100%;
  height: 32px;
  position: absolute;
  bottom: 8px;
  left: 80px;
  right: 80px;
`;

// create a new row when clicking just below CharmEditor
export default function DocumentEnd () {

  const view = useContext(EditorViewContext);

  function addRow () {
    if (!view) return;
    const { tr } = view.state;
    // set cursor at end of document
    view.dispatch(tr.setSelection(TextSelection.atEnd(tr.doc)));
    // find out if last row is empty - https://discuss.prosemirror.net/t/detect-if-caret-is-on-an-empty-line/306
    const { head, empty } = tr.selection;
    const isLastRowEmpty = empty && view.state.doc.resolve(head).parent.content.size === 0;

    if (!isLastRowEmpty) {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13
      });
      view.someProp('handleKeyDown', f => f(view, event));
    }
    view.focus();
  }
  return (
    <Component onClick={addRow}></Component>
  );
}

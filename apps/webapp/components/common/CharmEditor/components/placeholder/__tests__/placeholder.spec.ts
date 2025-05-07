import type { EditorView } from 'prosemirror-view';

import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'lib/prosemirror/builders';
import { setSelectionNear } from 'lib/testing/prosemirror/helpers';
import { renderTestEditor } from 'lib/testing/prosemirror/renderTestEditor';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('Placeholder component', () => {
  test('appears with empty paragraph', () => {
    const doc = _.doc(_.p(''));
    const editor = testEditor(doc);
    const placeholder = editor.view.dom.getAttribute('data-placeholder');
    expect(placeholder).not.toBeNull();
  });

  test('Does not show when there is text', () => {
    const doc = _.doc(_.p('some text'));
    const editor = testEditor(doc);
    const placeholder = editor.view.dom.getAttribute('data-placeholder');
    expect(placeholder).toBeNull();
  });

  test('Does not appear on an empty paragraph line with no selection', () => {
    const doc = _.doc(_.p('some text'), _.p(''));
    const editor = testEditor(doc);
    setSelectionNear(editor.view, 4);
    const placeholder = getPlaceholderAtSelection(editor.view);
    expect(placeholder).toBeNull();
  });

  test('Appears on an empty paragraph line with selection', () => {
    const doc = _.doc(_.p('some text'), _.p(''));
    const editor = testEditor(doc);
    setSelectionNear(editor.view, 12);
    const placeholder = getPlaceholderAtSelection(editor.view);
    expect(placeholder).not.toBeNull();
  });

  test('Appears inside a column layout', () => {
    const doc = _.doc(_.columnLayout(_.columnBlock(_.p(''))));
    const editor = testEditor(doc);
    const placeholder = getPlaceholderAtSelection(editor.view);
    expect(placeholder).not.toBeNull();
  });

  test('Does not appear inside a table', () => {
    const doc = _.doc(_.table(_.table_row(_.table_header(_.p('')))));
    const editor = testEditor(doc);
    setSelectionNear(editor.view, 4);
    const placeholder = getPlaceholderAtSelection(editor.view);
    expect(placeholder).toBeNull();
  });
});

function getPlaceholderAtSelection(view: EditorView) {
  const pos = view.state.selection.from;
  const selectedDom = view.domAtPos(pos).node as HTMLElement | undefined;
  return selectedDom?.getAttribute?.('data-placeholder') || null;
}

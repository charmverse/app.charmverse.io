import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'lib/prosemirror/builders';
import { setSelectionNear, expectNodesAreEqual } from 'testing/prosemirror/helpers';
import { sendKeyToPm } from 'testing/prosemirror/keyboard';
import { renderTestEditor } from 'testing/prosemirror/renderTestEditor';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('List items', () => {
  test('Return outdents an empty list item', () => {
    const before = _.doc(_.bullet_list({ indent: 1 }, _.list_item(_.p(''))), _.p(''));

    const after = _.doc(_.bullet_list({ indent: 0 }, _.list_item(_.p(''))), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 2);
    sendKeyToPm(editor.view, 'Enter');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Return delets an empty list item at the shallowest index', () => {
    const before = _.doc(_.bullet_list(_.list_item(_.p(''))), _.p(''));

    const after = _.doc(_.p(''), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 2);
    sendKeyToPm(editor.view, 'Enter');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Return with text on the line adds a new list item', () => {
    const before = _.doc(_.bullet_list(_.list_item(_.p('test'))), _.p(''));

    const after = _.doc(_.bullet_list(_.list_item(_.p('')), _.list_item(_.p('test'))), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 2);
    sendKeyToPm(editor.view, 'Enter');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Return at the end of a line adds a new list item', () => {
    const before = _.doc(_.bullet_list(_.list_item(_.p('test'))), _.p(''));

    const after = _.doc(_.bullet_list(_.list_item(_.p('test')), _.list_item(_.p(''))), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 7);
    sendKeyToPm(editor.view, 'Enter');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Return at the end of a line adds a new list item', () => {
    const before = _.doc(_.bullet_list(_.list_item(_.p('test'))), _.p(''));

    const after = _.doc(_.bullet_list(_.list_item(_.p('test')), _.list_item(_.p(''))), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 7);
    sendKeyToPm(editor.view, 'Enter');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Backspace at the beginning of a line removes the bullet and replaces the whitespace with a tab indent', () => {
    const before = _.doc(_.bullet_list({ indent: 1 }, _.list_item(_.p(''))), _.p(''));

    const after = _.doc(_.p(_.tabIndent({ indent: 1 }), ''), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 2);
    sendKeyToPm(editor.view, 'Backspace');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Backspace in-between lists should not merge lists', () => {
    const before = _.doc(
      _.bullet_list({ indent: 0 }, _.list_item(_.p('Apple'))),
      _.p(''),
      _.bullet_list({ indent: 1 }, _.list_item(_.p('Banana'))),
      _.p('')
    );

    const after = _.doc(
      _.bullet_list({ indent: 0 }, _.list_item(_.p('Apple'))),
      _.bullet_list({ indent: 1 }, _.list_item(_.p('Banana'))),
      _.p('')
    );
    const editor = testEditor(before);
    setSelectionNear(editor.view, 9);
    sendKeyToPm(editor.view, 'Backspace');
    expectNodesAreEqual(editor.view.state.doc, after);
  });

  test('Backspace in-between lists should not merge lists unless the indent is the same', () => {
    const before = _.doc(
      _.bullet_list({ indent: 0 }, _.list_item(_.p('Apple'))),
      _.p(''),
      _.bullet_list({ indent: 0 }, _.list_item(_.p('Banana'))),
      _.p('')
    );

    const after = _.doc(_.bullet_list({ indent: 0 }, _.list_item(_.p('Apple')), _.list_item(_.p('Banana'))), _.p(''));
    const editor = testEditor(before);
    setSelectionNear(editor.view, 9);
    sendKeyToPm(editor.view, 'Backspace');
    expectNodesAreEqual(editor.view.state.doc, after);
  });
});

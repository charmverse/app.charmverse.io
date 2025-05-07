import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'lib/prosemirror/builders';
import { renderTestEditor } from 'lib/testing/prosemirror/renderTestEditor';

import { rowNodeAtPos } from '../rowActions';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('rowNodeAtPos() returns the DOM node given a position in the prosemirror document', () => {
  test('When pos is inside a text node, returns the parent paragraph', () => {
    const doc = _.doc(_.p('hello world'));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 3);
    const paragraphNode = editor.view.dom.children[0];
    expect(result?.rowNode).toBe(paragraphNode);
  });

  test('When pos is inside text inside a column, returns the paragraph node', () => {
    const doc = _.doc(_.columnLayout(_.columnBlock(_.p('hello world'))));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 5);
    expect(result?.node.pmViewDesc?.node?.type.name).toBe('text');
    expect(result?.rowNode.pmViewDesc?.node?.type.name).toBe('paragraph');
  });

  test('When pos is on a column block, returns the first child', () => {
    const doc = _.doc(_.columnLayout(_.columnBlock(_.p('hello world'))));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 2);
    expect(result?.node.pmViewDesc?.node?.type.name).toBe('columnBlock');
    expect(result?.rowNode.pmViewDesc?.node?.type.name).toBe('paragraph');
  });
});

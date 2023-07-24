import { Fragment, Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'testing/prosemirror/builders';
import { renderTestEditor } from 'testing/prosemirror/renderTestEditor';

import { rowNodeAtPos } from '../rowActions';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('rowNodeAtPos()', () => {
  test('Returns the top-most node in a document', () => {
    const doc = _.doc();
    const editor = testEditor(doc);
    const node = rowNodeAtPos(editor.view, 2);
  });

  test('Returns the top-most node in a column', () => {});

  test('Returns the paragraph when pos is inside a text node', () => {});

  test('Returns the columnLayout when pos is inside a column block', () => {});
});

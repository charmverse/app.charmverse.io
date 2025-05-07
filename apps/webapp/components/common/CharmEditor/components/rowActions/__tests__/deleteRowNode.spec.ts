import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'lib/prosemirror/builders';
import { renderTestEditor } from 'lib/testing/prosemirror/renderTestEditor';

import { deleteRowNode } from '../rowActions';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('deleteRowNode() deletes the DOM node given a position in the prosemirror document', () => {
  test('When page node is inside a columnBlock', () => {
    const doc = _.doc(
      _.columnLayout(
        _.columnBlock(_.page(), _.p('Paragraph 1'), _.page(), _.p('Paragraph 2'), _.page()),
        _.columnBlock(_.p('Paragraph 3'))
      )
    );
    const editor = testEditor(doc);
    deleteRowNode({
      view: editor.view,
      rowNodeOffset: 0,
      // row position 2 indicates the first page node in the first column
      rowPosition: 2
    });

    expect(editor.view.state.doc.toJSON()).toStrictEqual(
      _.doc(
        _.columnLayout(
          _.columnBlock(_.p('Paragraph 1'), _.page(), _.p('Paragraph 2'), _.page()),
          _.columnBlock(_.p('Paragraph 3'))
        ),
        _.p('')
      ).toJSON()
    );

    deleteRowNode({
      view: editor.view,
      rowNodeOffset: 1,
      // Deleting the second page node in the first column
      rowPosition: 2 + (editor.view.state.doc.nodeAt(2)?.nodeSize || 0)
    });

    expect(editor.view.state.doc.toJSON()).toStrictEqual(
      _.doc(
        _.columnLayout(
          _.columnBlock(_.p('Paragraph 1'), _.p('Paragraph 2'), _.page()),
          _.columnBlock(_.p('Paragraph 3'))
        ),
        _.p('')
      ).toJSON()
    );
  });

  test('What page node is not inside a columnBlock', () => {
    const doc = _.doc(_.page(), _.p('Paragraph 1'), _.page());
    const editor = testEditor(doc);
    deleteRowNode({
      view: editor.view,
      rowNodeOffset: 0,
      rowPosition: 1
    });

    expect(editor.view.state.doc.toJSON()).toStrictEqual(_.doc(_.p('Paragraph 1'), _.page(), _.p('')).toJSON());
  });
});

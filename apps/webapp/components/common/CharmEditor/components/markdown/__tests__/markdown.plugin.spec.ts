import { TextSelection } from 'prosemirror-state';

import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'lib/prosemirror/builders';
import { dispatchPasteEvent, expectNodesAreEqual } from 'lib/testing/prosemirror/helpers';
import { renderTestEditor } from 'lib/testing/prosemirror/renderTestEditor';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('Charmeditor: Markdown integration', () => {
  test('Handles pasting from text editor', () => {
    const markdown = `# First heading`;
    const expectedResult = _.doc(_.heading({ level: 1 }, 'First heading'), _.p(''));
    const editor = testEditor();
    dispatchPasteEvent(editor.view, { plain: markdown });
    expectNodesAreEqual(editor.view.state.doc, expectedResult);
  });

  test('Handle pasting inside a code block with newlines', () => {
    const code = `function foo() {\n  return 'bar';\n}`;
    const editor = testEditor(_.doc(_.p('1'), _.codeBlock(), _.p('2')));

    editor.view.dispatch(editor.view.state.tr.setSelection(new TextSelection(editor.view.state.doc.resolve(4))));

    dispatchPasteEvent(editor.view, { plain: code });
    const expectedResult = _.doc(_.p('1'), _.codeBlock(code), _.p('2'));
    expectNodesAreEqual(editor.view.state.doc, expectedResult);
  });

  test('Handles pasting from VS Code', () => {
    // Include the HTML which causes PM to skip clipboardTextParser
    const html = `<meta charset='utf-8'><div style="color: #abb2bf;background-color: #282c34;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"><div><span style="color: #e06c75;"># Heading</span></div><div><span style="color: #e06c75;">## Heading 2</span></div><div><span style="color: #e06c75;">### Heading 3</span></div></div>`;
    const plain = `# Heading\n## Heading 2\n### Heading 3`;
    const expectedResult = _.doc(
      _.heading({ level: 1 }, 'Heading'),
      _.heading({ level: 2 }, 'Heading 2'),
      _.heading({ level: 3 }, 'Heading 3'),
      _.p('')
    );
    const editor = testEditor();
    dispatchPasteEvent(editor.view, { html, plain });
    expectNodesAreEqual(editor.view.state.doc, expectedResult);
  });
});

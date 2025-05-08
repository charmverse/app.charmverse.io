import { specRegistry } from '@packages/bangleeditor/specRegistry';
import { Fragment, Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { indentListItem } from '../listItem.component';

const specRegistrySchema = specRegistry.schema;

function doc(...items: (string | Node)[]): any {
  const content = items.map((item) => {
    if (typeof item === 'string') {
      const textNode = specRegistrySchema.text(item);
      const paragraphNode = specRegistrySchema.nodes.paragraph.create({}, Fragment.from(textNode));
      return paragraphNode;
    } else {
      return item;
    }
  });
  return specRegistrySchema.nodes.doc.create({}, Fragment.fromArray(content)).toJSON();
}

function li(...content: (string | Node)[]): Node {
  const nodes = content.map((item) => {
    if (typeof item === 'string') {
      return specRegistrySchema.nodes.paragraph.create({}, Fragment.from(specRegistrySchema.text(item)));
    } else {
      return item;
    }
  });

  return specRegistrySchema.nodes.listItem.create({}, Fragment.fromArray(nodes));
}

function bl(...content: (string | Node)[]): Node {
  const nodes = content.map((item) => {
    if (typeof item === 'string') {
      return li(item);
    } else {
      return item;
    }
  });

  return specRegistrySchema.nodes.bulletList.create({}, Fragment.fromArray(nodes));
}

test('Show return false for indentList if cursor is at parent bullet list item, indicating tab and indent', () => {
  const state = EditorState.create({
    doc: Node.fromJSON(specRegistrySchema, doc(bl('Bullet 1', bl('Bullet 1.1', 'Bullet 1.2'))))
  });
  const tr = state.tr.setSelection(new TextSelection(state.doc.resolve(7)));
  const nodeSelectedState = state.apply(tr);
  const commandExecuted = indentListItem()(nodeSelectedState, nodeSelectedState.apply);
  expect(commandExecuted).toBe(false);
});

test('Show return true for indentList if cursor is at parent bullet list item, indicating no tab and no indent', () => {
  const state = EditorState.create({
    doc: Node.fromJSON(specRegistrySchema, doc(bl('Bullet 1', bl('Bullet 1.1', 'Bullet 1.2'))))
  });
  // Multiline selection
  const tr = state.tr.setSelection(new TextSelection(state.doc.resolve(7), state.doc.resolve(18)));
  const nodeSelectedState = state.apply(tr);
  const commandExecuted = indentListItem()(nodeSelectedState, nodeSelectedState.apply);
  expect(commandExecuted).toBe(true);
});

test('Show return true for indentList if cursor is at child bullet list item, indicating no tab and indent', () => {
  const state = EditorState.create({
    doc: Node.fromJSON(specRegistrySchema, doc(bl('Bullet 1', bl('Bullet 1.1', 'Bullet 1.2'))))
  });
  const nodeSelectedState = state.apply(state.tr.setSelection(new TextSelection(state.doc.resolve(32))));
  let newEditorState: EditorState | undefined;
  const commandExecuted = indentListItem()(nodeSelectedState, (tr) => {
    newEditorState = nodeSelectedState.apply(tr);
    return newEditorState;
  });

  expect(commandExecuted).toBe(true);
  expect(newEditorState?.doc.toJSON()).toStrictEqual(doc(bl('Bullet 1', bl(li('Bullet 1.1', bl('Bullet 1.2'))))));
});

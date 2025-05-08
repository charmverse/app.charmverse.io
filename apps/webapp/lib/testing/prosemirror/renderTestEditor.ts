import type { SpecRegistry } from '@packages/bangleeditor/specRegistry';
import type { Node } from 'prosemirror-model';
import type { EditorState, Selection } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { BangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/core/bangle-editor';
import { BangleEditorState } from 'components/common/CharmEditor/components/@bangle.dev/core/bangle-editor-state';
import {
  resetRenderHandlersCache,
  saveRenderHandlers
} from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import { nodeViewRenderHandlers } from 'components/common/CharmEditor/components/@bangle.dev/react/node-view-helpers';

const mountedEditors = new Set<BangleEditor>();
if (typeof afterEach === 'function') {
  afterEach(() => {
    [...mountedEditors].forEach((editor: BangleEditor) => {
      editor.destroy();
      mountedEditors.delete(editor);
    });
    resetRenderHandlersCache();
  });
}

export function renderTestEditor(
  { specRegistry, plugins }: { specRegistry: SpecRegistry; plugins: any },
  testId = 'test-editor'
) {
  if (!specRegistry) {
    throw new Error('Please provide SpecRegistry');
  }

  if (!plugins) {
    throw new Error('Please provide Plugins');
  }

  const newPlugins = plugins;
  // To bypass the deprecation of plugin being a function
  plugins = () => newPlugins;
  const container = document.body.appendChild(document.createElement('div'));
  container.setAttribute('data-testid', testId);

  return (testDoc?: any) => {
    const editorProps = {
      // include bangle-editor-core to support prosemirror-tables fork
      attributes: { class: 'bangle-editor content bangle-editor-core' }
    };
    const editor: BangleEditor = new BangleEditor(container, {
      state: new BangleEditorState({
        specRegistry,
        plugins,
        editorProps
      }),
      pmViewOpts: {
        // editable: () => !readOnly,
        plugins: [],
        attributes: () => ({
          // translate: readOnly ? 'yes' : 'no',
          class: 'bangle-editor',
          'data-test': 'charm-editor-input'
        })
      }
    });

    const view = editor.view;
    mountedEditors.add(editor);
    saveRenderHandlers(
      view.dom.parentNode as HTMLElement,
      nodeViewRenderHandlers(() => {})
    );

    if (testDoc) {
      updateDoc(testDoc);
    }

    function updateDoc(doc: Node) {
      if (!doc) {
        return;
      }
      const editorView = view;
      const dispatch = editorView.dispatch;
      const tr = editorView.state.tr.replaceWith(0, editorView.state.doc.nodeSize - 2, doc);
      tr.setMeta('addToHistory', false);
      dispatch(tr);
    }

    return {
      get editor() {
        return editor;
      },
      get view() {
        return editor?.view;
      },
      container,
      editorState: view.state as EditorState,
      schema: view.state.schema,
      selection: view.state.selection as Selection,
      updateDoc,
      destroy: () => {
        editor?.destroy();
        (editor as any) = null;
      },
      debugString: () => {
        return editor?.view.state.doc.toString();
      }
    };
  };
}

function setTextSelection(view: EditorView, anchor: number, head?: number): void {
  const { state } = view;
  const tr = state.tr.setSelection(TextSelection.create(state.doc, anchor, head));
  view.dispatch(tr);
}

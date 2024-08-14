import type { Plugin } from '@bangle.dev/pm';
import type { BangleEditorProps as CoreBangleEditorProps } from '@root/components/common/CharmEditor/components/@bangle.dev/core/bangle-editor';
import { BangleEditor as CoreBangleEditor } from '@root/components/common/CharmEditor/components/@bangle.dev/core/bangle-editor';
import { EditorViewContext } from '@root/components/common/CharmEditor/components/@bangle.dev/react/editorContext';
import { isTouchScreen } from '@root/lib/utils/browser';
import { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

interface ReactBangleEditorProps<PluginMetadata = any> extends CoreBangleEditorProps<PluginMetadata> {
  children?: React.ReactNode;
  readOnly?: boolean;
  initialContent?: any;
  setCharmEditorView?: (view: EditorView | null) => void;
}

export const ReactBangleEditor = React.forwardRef<CoreBangleEditor | undefined, ReactBangleEditorProps>(
  function ReactEditor(
    { state, children, initialContent, focusOnInit, pmViewOpts, readOnly = false, setCharmEditorView },
    ref
  ) {
    focusOnInit = focusOnInit ?? (!readOnly && !isTouchScreen());
    const renderRef = useRef<HTMLDivElement>(null);
    pmViewOpts ||= {};

    const editorViewPayloadRef = useRef({
      state,
      focusOnInit,
      pmViewOpts
    });

    const [editor, setEditor] = useState<CoreBangleEditor>();

    useImperativeHandle(
      ref,
      () => {
        return editor;
      },
      [editor]
    );

    useEffect(() => {
      const _editor = new CoreBangleEditor(renderRef.current!, editorViewPayloadRef.current);
      (_editor.view as any)._updatePluginWatcher = updatePluginWatcher(_editor);
      setEditor(_editor);
      if (setCharmEditorView) {
        setCharmEditorView(_editor.view);
      }
      setEditorContent(_editor, initialContent);
      return () => {
        setCharmEditorView?.(null);
        _editor.destroy();
      };
    }, [ref]);

    return (
      <EditorViewContext.Provider value={editor?.view as any}>{editor ? children : null}</EditorViewContext.Provider>
    );
  }
);

function updatePluginWatcher(editor: CoreBangleEditor) {
  return (watcher: Plugin, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove ? state.plugins.filter((p) => p !== watcher) : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins
    });

    editor.view.updateState(state);
  };
}

function setEditorContent(editor: CoreBangleEditor, content?: any) {
  if (content) {
    const schema = editor.view.state.schema;
    const doc = schema.nodeFromJSON(content);
    const stateConfig = {
      schema,
      doc,
      plugins: editor.view.state.plugins
    };
    if (editor.view && !editor.view.isDestroyed) {
      // Set document in prosemirror
      editor.view.setProps({ state: EditorState.create(stateConfig) });
    }
  }
}

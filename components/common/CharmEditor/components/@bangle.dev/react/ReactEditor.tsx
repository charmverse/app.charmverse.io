import {
  BangleEditor as CoreBangleEditor,
  BangleEditorProps as CoreBangleEditorProps
} from '@bangle.dev/core';
import { Plugin } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { nodeViewUpdateStore, useNodeViews } from '@bangle.dev/react/node-view-helpers';
import { NodeViewWrapper, RenderNodeViewsFunction } from '@bangle.dev/react/NodeViewWrapper';
import { objectUid } from '@bangle.dev/utils';
import React, { ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

interface BangleEditorProps<PluginMetadata = any>
  extends CoreBangleEditorProps<PluginMetadata> {
  id?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor<PluginMetadata>) => void;
  editorViewRef?: typeof useRef;
  // Components that should be placed underneath the editor
  placeholderComponent?: ReactNode
}

export const BangleEditor = React.forwardRef<
  CoreBangleEditor | undefined,
  BangleEditorProps
>(
  (
    {
      id,
      state,
      children,
      focusOnInit = true,
      pmViewOpts,
      renderNodeViews,
      className,
      style,
      onReady = () => {},
      placeholderComponent
    },
    ref,
  ) => {
    const renderRef = useRef<HTMLDivElement>(null);
    const onReadyRef = useRef(onReady);
    const editorViewPayloadRef = useRef({
      state,
      focusOnInit,
      pmViewOpts,
    });
    const [editor, setEditor] = useState<CoreBangleEditor>();
    const nodeViews = useNodeViews(renderRef);

    useImperativeHandle(
      ref,
      () => {
        return editor;
      },
      [editor],
    );

    useEffect(() => {
      const editor = new CoreBangleEditor(
        renderRef.current!,
        editorViewPayloadRef.current,
      );
      (editor.view as any)._updatePluginWatcher = updatePluginWatcher(editor);
      onReadyRef.current(editor);
      setEditor(editor);

      return () => {
        editor.destroy();
      };
    }, [ref]);

    if (nodeViews.length > 0 && renderNodeViews == null) {
      throw new Error(
        'When using nodeViews, you must provide renderNodeViews callback',
      );
    }

    return (
      <React.Fragment>
        <EditorViewContext.Provider value={editor?.view as any}>
          <div className="bangle-editor-core">
            {editor ? children : null}
            <div ref={renderRef} id={id} className={className} style={style} />
            {editor ? placeholderComponent : null}
          </div>
          {nodeViews.map((nodeView) => {
            return reactDOM.createPortal(
              <NodeViewWrapper
                debugKey={objectUid.get(nodeView)}
                nodeViewUpdateStore={nodeViewUpdateStore}
                nodeView={nodeView}
                renderNodeViews={renderNodeViews!}
              />,
              nodeView.containerDOM!,
              objectUid.get(nodeView),
            );
          })}
        </EditorViewContext.Provider>
      </React.Fragment>
    );
  },
);

const updatePluginWatcher = (editor: CoreBangleEditor) => {
  return (watcher: Plugin, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins,
    });

    log('Adding watching to existing state', watcher);
    editor.view.updateState(state);
  };
};

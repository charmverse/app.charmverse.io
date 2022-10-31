import type {
  BangleEditorProps as CoreBangleEditorProps
} from '@bangle.dev/core';
import {
  BangleEditor as CoreBangleEditor
} from '@bangle.dev/core';
import type { Plugin, Transaction } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { nodeViewUpdateStore, useNodeViews } from '@bangle.dev/react/node-view-helpers';
import { objectUid } from '@bangle.dev/utils';
import type { ReactNode, RefObject } from 'react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';

import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { isTouchScreen } from 'lib/utilities/browser';

import { amendTransaction } from '../../suggestions/track/amendTransaction';

import { NodeViewWrapper } from './NodeViewWrapper';
import type { RenderNodeViewsFunction } from './NodeViewWrapper';

interface BangleEditorProps<PluginMetadata = any>
  extends CoreBangleEditorProps<PluginMetadata> {
  id?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor<PluginMetadata>) => void;
  editorRef?: RefObject<HTMLDivElement>;
  // Components that should be placed underneath the editor
  placeholderComponent?: ReactNode;
  enableSuggestions?: boolean; // requires trackChanges to be true
  trackChanges?: boolean;
}

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
      plugins: newPlugins
    });

    editor.view.updateState(state);
  };
};

export const BangleEditor = React.forwardRef<
  CoreBangleEditor | undefined,
  BangleEditorProps
>(
  (
    {
      id,
      state,
      children,
      focusOnInit = !isTouchScreen(),
      pmViewOpts,
      renderNodeViews,
      className,
      style,
      onReady = () => {},
      placeholderComponent,
      editorRef,
      enableSuggestions = false,
      trackChanges = false
    },
    ref
  ) => {
    const renderRef = useRef<HTMLDivElement>(null);
    const onReadyRef = useRef(onReady);
    const editorViewPayloadRef = useRef({
      state,
      focusOnInit,
      pmViewOpts,
      enableSuggestions
    });
    const [editor, setEditor] = useState<CoreBangleEditor>();
    const nodeViews = useNodeViews(renderRef);
    const { user } = useUser();

    if (enableSuggestions && !trackChanges) {
      log.error('CharmEditor: Suggestions require trackChanges to be enabled');
    }

    // set current
    editorViewPayloadRef.current.enableSuggestions = enableSuggestions;

    useImperativeHandle(
      ref,
      () => {
        return editor;
      },
      [editor]
    );

    useEffect(() => {
      const _editor = new CoreBangleEditor(
        renderRef.current!,
        editorViewPayloadRef.current
      );
      (_editor.view as any)._updatePluginWatcher = updatePluginWatcher(_editor);
      if (trackChanges) {
        (_editor.view as any)._props.dispatchTransaction = (transaction: Transaction) => {
          const view = _editor.view;
          const trackedUser = { id: user?.id ?? '', username: user?.username ?? '' };
          const trackedTr = amendTransaction(transaction, view.state, trackedUser, editorViewPayloadRef.current.enableSuggestions);
          const { state: newState } = view.state.applyTransaction(trackedTr);
          view.updateState(newState);
        };
      }
      onReadyRef.current(_editor);
      setEditor(_editor);
      return () => {
        _editor.destroy();
      };
    }, [ref]);

    if (nodeViews.length > 0 && renderNodeViews == null) {
      throw new Error(
        'When using nodeViews, you must provide renderNodeViews callback'
      );
    }

    return (
      <EditorViewContext.Provider value={editor?.view as any}>
        <div ref={editorRef} className='bangle-editor-core'>
          {editor ? children : null}
          <div ref={renderRef} id={id} className={className} style={style} />
          {editor ? placeholderComponent : null}
        </div>
        {nodeViews.map((nodeView) => {
          return reactDOM.createPortal(
            <NodeViewWrapper
              nodeViewUpdateStore={nodeViewUpdateStore}
              nodeView={nodeView}
              renderNodeViews={renderNodeViews!}
            />,
              nodeView.containerDOM!,
              objectUid.get(nodeView)
          );
        })}
      </EditorViewContext.Provider>
    );
  }
);

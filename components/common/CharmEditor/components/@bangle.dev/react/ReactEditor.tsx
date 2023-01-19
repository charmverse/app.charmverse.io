import type { BangleEditorProps as CoreBangleEditorProps } from '@bangle.dev/core';
import { BangleEditor as CoreBangleEditor } from '@bangle.dev/core';
import { EditorState } from '@bangle.dev/pm';
import type { Plugin } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { objectUid } from '@bangle.dev/utils';
import styled from '@emotion/styled';
import type { RefObject } from 'react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { isTouchScreen } from 'lib/utilities/browser';

import { FidusEditor } from '../../fiduswriter/fiduseditor';

import { nodeViewUpdateStore, useNodeViews } from './node-view-helpers';
import { NodeViewWrapper } from './NodeViewWrapper';
import type { RenderNodeViewsFunction } from './NodeViewWrapper';

const StyledLoadingComponent = styled(LoadingComponent)`
  position: absolute;
  width: 100%;
  align-items: flex-end;
`;

interface BangleEditorProps<PluginMetadata = any> extends CoreBangleEditorProps<PluginMetadata> {
  pageId?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  editorRef?: RefObject<HTMLDivElement>;
  enableSuggestions?: boolean; // requires trackChanges to be true
  trackChanges?: boolean;
  readOnly?: boolean;
  onParticipantUpdate?: (participants: FrontendParticipant[]) => void;
  isContentControlled?: boolean;
  enableComments?: boolean;
}

export const BangleEditor = React.forwardRef<CoreBangleEditor | undefined, BangleEditorProps>(function ReactEditor(
  {
    pageId,
    state,
    children,
    isContentControlled,
    focusOnInit = !isTouchScreen(),
    pmViewOpts,
    renderNodeViews,
    className,
    style,
    editorRef,
    enableSuggestions = false,
    trackChanges = false,
    onParticipantUpdate = () => {},
    readOnly = false,
    enableComments = true
  },
  ref
) {
  const renderRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const enableFidusEditor = Boolean(user && pageId && trackChanges && !isContentControlled);
  const [isLoading, setIsLoading] = useState(enableFidusEditor);
  const isLoadingRef = useRef(enableFidusEditor);
  const useSockets = user && pageId && trackChanges && (!readOnly || enableComments) && !isContentControlled;

  const { data: authResponse } = useSWRImmutable(useSockets ? user?.id : null, () => charmClient.socket()); // refresh when user

  pmViewOpts ||= {};
  pmViewOpts.editable = () => !readOnly && !isLoadingRef.current;

  const editorViewPayloadRef = useRef({
    state,
    focusOnInit,
    pmViewOpts,
    enableSuggestions
  });
  const [editor, setEditor] = useState<CoreBangleEditor>();
  const [showLoader, setShowLoader] = useState(false);
  const nodeViews = useNodeViews(renderRef);
  const { showMessage } = useSnackbar();

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

  function onError(error: Error) {
    showMessage(error.message, 'warning');
    log.error('[ws/ceditor]: Error message displayed to user', { error });
  }

  useEffect(() => {
    const _editor = new CoreBangleEditor(renderRef.current!, editorViewPayloadRef.current);
    let fEditor: FidusEditor;

    if (isContentControlled) {
      setIsLoading(false);
    } else if (useSockets) {
      if (authResponse) {
        log.info('Init FidusEditor');
        fEditor = new FidusEditor({
          user,
          docId: pageId,
          enableSuggestionMode: enableSuggestions,
          onDocLoaded: () => {
            setIsLoading(false);
            isLoadingRef.current = false;
            // console.log('set is loading false');
          },
          onParticipantUpdate
        });
        fEditor.init(_editor.view, authResponse.authToken, onError);
      }
    } else if (pageId && readOnly) {
      charmClient.pages.getPageDetails(pageId).then((page) => {
        if (_editor) {
          setIsLoading(false);
          isLoadingRef.current = false;
          const schema = _editor.view.state.schema;
          let doc = _editor.view.state.doc;
          if (page.content) {
            doc = schema.nodeFromJSON(page.content);
          }
          const stateConfig = {
            schema,
            doc,
            plugins: _editor.view.state.plugins
          };
          // Set document in prosemirror
          _editor.view.setProps({ state: EditorState.create(stateConfig) });
        }
      });
    }
    (_editor.view as any)._updatePluginWatcher = updatePluginWatcher(_editor);
    setEditor(_editor);
    return () => {
      fEditor?.close();
      _editor.destroy();
    };
  }, [user, pageId, useSockets, authResponse, authResponse, ref]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(true), 300);
    return () => clearTimeout(timer);
  }, [setShowLoader]);

  if (nodeViews.length > 0 && renderNodeViews == null) {
    throw new Error('When using nodeViews, you must provide renderNodeViews callback');
  }
  return (
    <EditorViewContext.Provider value={editor?.view as any}>
      {editor ? children : null}
      <div
        ref={editorRef}
        className='bangle-editor-core'
        style={{ minHeight: showLoader && isLoading ? '300px' : undefined }}
      >
        <StyledLoadingComponent height='300px' isLoading={showLoader && isLoading} />
        <div ref={renderRef} id={pageId} className={className} style={style} />
      </div>
      {nodeViews.map((nodeView) => {
        return nodeView.containerDOM
          ? reactDOM.createPortal(
              <NodeViewWrapper
                nodeViewUpdateStore={nodeViewUpdateStore}
                nodeView={nodeView}
                renderNodeViews={renderNodeViews!}
              />,
              nodeView.containerDOM,
              objectUid.get(nodeView)
            )
          : null;
      })}
    </EditorViewContext.Provider>
  );
});

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

import { history } from '@bangle.dev/base-components';
import type { BangleEditorProps as CoreBangleEditorProps } from '@bangle.dev/core';
import { BangleEditor as CoreBangleEditor } from '@bangle.dev/core';
import { EditorState } from '@bangle.dev/pm';
import type { Plugin, PluginKey } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { objectUid } from '@bangle.dev/utils';
import styled from '@emotion/styled';
import type { RefObject } from 'react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import { undoEventName } from 'components/common/CharmEditor/utils';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { isTouchScreen } from 'lib/utilities/browser';

import { FidusEditor } from '../../fiduswriter/fiduseditor';

import { nodeViewUpdateStore, useNodeViews } from './node-view-helpers';
import { NodeViewWrapper } from './NodeViewWrapper';
import type { RenderNodeViewsFunction } from './NodeViewWrapper';

const { undo } = history;

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
  initialContent?: any;
  enableComments?: boolean;
}

const warningText = 'You have unsaved changes. Please confirm changes.';

export const BangleEditor = React.forwardRef<CoreBangleEditor | undefined, BangleEditorProps>(function ReactEditor(
  {
    pageId,
    state,
    children,
    isContentControlled,
    initialContent,
    focusOnInit,
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
  focusOnInit = focusOnInit ?? (!readOnly && !isTouchScreen());

  const renderRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const enableFidusEditor = Boolean(user && pageId && trackChanges && !isContentControlled);
  const [isLoading, setIsLoading] = useState(enableFidusEditor);
  const isLoadingRef = useRef(enableFidusEditor);
  const useSockets = user && pageId && trackChanges && (!readOnly || enableComments) && !isContentControlled;

  const { data: authResponse, error: authError } = useSWRImmutable(useSockets ? user?.id : null, () =>
    charmClient.socket()
  ); // refresh when user

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

  function onError(_editor: CoreBangleEditor, error: Error) {
    showMessage(error.message, 'warning');
    log.error('[ws/ceditor]: Error message displayed to user', { error });
    if (isLoading) {
      setIsLoading(false);
      isLoadingRef.current = false;
      setEditorContent(_editor, initialContent);
    }
  }

  useEffect(() => {
    function listener(event: Event) {
      if (editor) {
        const detail = (event as CustomEvent).detail as { pageId: string } | null;
        if (detail && detail.pageId === pageId) {
          undo()(editor.view.state, editor.view.dispatch);
        }
      }
    }

    if (editorRef && editorRef.current && editor) {
      editorRef.current.addEventListener(undoEventName, listener);
      return () => {
        editorRef.current?.removeEventListener(undoEventName, listener);
      };
    }
  }, [editorRef, editor]);

  let fEditor: FidusEditor | null = null;

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (fEditor) {
        if (fEditor.ws?.messagesToSend.length === 0) return;
        e.preventDefault();
        (e || window.event).returnValue = warningText;
        return warningText;
      }
    };

    window.addEventListener('beforeunload', handleWindowClose);

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
    };
  }, []);

  useEffect(() => {
    const _editor = new CoreBangleEditor(renderRef.current!, editorViewPayloadRef.current);

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
          },
          onParticipantUpdate
        });
        fEditor.init(_editor.view, authResponse.authToken, (error) => onError(_editor, error));
      } else if (authError) {
        log.warn('Loading readonly mode of editor due to web socket failure', { error: authError });
        setIsLoading(false);
        isLoadingRef.current = false;
        setEditorContent(_editor, initialContent);
      }
    } else if (pageId && readOnly) {
      setIsLoading(false);
      isLoadingRef.current = false;
      setEditorContent(_editor, initialContent);
    }
    (_editor.view as any)._updatePluginWatcher = updatePluginWatcher(_editor);
    setEditor(_editor);
    return () => {
      fEditor?.close();
      _editor.destroy();
    };
  }, [user?.id, pageId, useSockets, authResponse, authError, ref]);

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
        data-page-id={pageId}
        style={{ minHeight: showLoader && isLoading ? '200px' : undefined, cursor: readOnly ? 'default' : 'text' }}
        onClick={() => !readOnly && editor?.view.focus()}
      >
        <StyledLoadingComponent isLoading={showLoader && isLoading} />
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

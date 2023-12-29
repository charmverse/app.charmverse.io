import { history } from '@bangle.dev/base-components';
import { EditorState } from '@bangle.dev/pm';
import type { Plugin } from '@bangle.dev/pm';
import { objectUid } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';
import type { PageType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import type { PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { MouseEvent, RefObject } from 'react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import type { BangleEditorProps as CoreBangleEditorProps } from 'components/common/CharmEditor/components/@bangle.dev/core/bangle-editor';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import { undoEventName } from 'components/common/CharmEditor/utils';
import LoadingComponent from 'components/common/LoadingComponent';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { getThreadsKey } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { insertAndFocusLineAtEndofDoc } from 'lib/prosemirror/insertAndFocusLineAtEndofDoc';
import { isTouchScreen } from 'lib/utilities/browser';

import { FidusEditor } from '../../fiduswriter/fiduseditor';
import type { ConnectionEvent } from '../../fiduswriter/ws';
import { threadPluginKey } from '../../thread/thread.plugins';
import { convertFileToBase64, imageFileDropEventName } from '../base-components/image';
import { BangleEditor as CoreBangleEditor } from '../core/bangle-editor';

import { nodeViewUpdateStore, useNodeViews } from './node-view-helpers';
import { NodeViewWrapper } from './NodeViewWrapper';
import type { RenderNodeViewsFunction } from './NodeViewWrapper';

const { undo } = history;

const StyledLoadingComponent = styled(LoadingComponent)`
  position: absolute;
  width: 100%;
  align-items: flex-end;
`;

export const EditorViewContext = React.createContext<EditorView>(
  /* we have to provide a default value to createContext */
  null as unknown as EditorView
);

interface BangleEditorProps<PluginMetadata = any> extends CoreBangleEditorProps<PluginMetadata> {
  pageId?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  linksPluginKey?: PluginKey;
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
  onConnectionEvent?: (event: ConnectionEvent) => void;
  allowClickingFooter?: boolean;
  inline?: boolean;
  pageType?: PageType | 'post';
  postId?: string;
  threadIds?: string[];
}

const warningText = 'You have unsaved changes. Please confirm changes.';

export const BangleEditor = React.forwardRef<CoreBangleEditor | undefined, BangleEditorProps>(function ReactEditor(
  {
    inline = false,
    pageId,
    state,
    children,
    isContentControlled,
    initialContent,
    focusOnInit,
    linksPluginKey,
    pmViewOpts,
    renderNodeViews,
    className,
    style,
    editorRef,
    enableSuggestions = false,
    trackChanges = false,
    onParticipantUpdate = () => {},
    readOnly = false,
    enableComments = true,
    onConnectionEvent,
    allowClickingFooter,
    pageType,
    postId,
    threadIds
  },
  ref
) {
  focusOnInit = focusOnInit ?? (!readOnly && !isTouchScreen());
  const renderRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { pages, loadingPages } = usePages();
  const enableFidusEditor = Boolean(user && pageId && trackChanges && !isContentControlled);
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

  // Make sure views are updated after we get the doc_data
  useEffect(() => {
    if (editor && threadIds && !isLoadingRef.current) {
      editor.view.dispatch(editor.view.state.tr.setMeta(threadPluginKey, threadIds));
    }
  }, [(threadIds ?? []).join(','), isLoadingRef.current]);

  function _onConnectionEvent(_editor: CoreBangleEditor, event: ConnectionEvent) {
    if (onConnectionEvent) {
      onConnectionEvent(event);
    } else if (event.type === 'error') {
      // for now, just use a standard error message to be over-cautious
      showMessage(event.error.message, 'warning');
    }
    if (event.type === 'error') {
      log.error('[ws/ceditor]: Error message displayed to user', {
        pageId,
        error: event.error
      });
      if (isLoadingRef.current) {
        isLoadingRef.current = false;
        setEditorContent(_editor, initialContent);
      }
    } else {
      log.debug('[ws/ceditor] Subscribed to document');
    }
  }

  function onClickEditorBottom(event: MouseEvent) {
    if (editor && !readOnly) {
      event.preventDefault();
      // insert new line
      insertAndFocusLineAtEndofDoc(editor.view);
    }
  }

  useEffect(() => {
    function editorUndoListener(event: Event) {
      if (editor) {
        const detail = (event as CustomEvent).detail as { pageId: string } | null;
        if (detail && detail.pageId === pageId) {
          undo()(editor.view.state, editor.view.dispatch);
        }
      }
    }

    async function handleImageFileDrop(e: Event) {
      if (!editor) {
        return;
      }
      const imageType = editor.view.state.schema.nodes.image;
      const files = (e as CustomEvent).detail.files as File[];

      if (!files || files.length === 0) {
        return;
      }
      for (const file of files) {
        const base64 = await convertFileToBase64(file);

        // Add image to the end of the document
        editor.view.dispatch(
          editor.view.state.tr.insert(
            editor.view.state.doc.nodeSize - 2,
            imageType.create({
              src: base64
            })
          )
        );
      }
    }

    if (
      editorRef &&
      editorRef.current &&
      editor &&
      !readOnly &&
      !inline &&
      (pageId || postId) &&
      pageType?.match(/(page|card|post|proposal|bounty)/)
    ) {
      editorRef.current.addEventListener(undoEventName, editorUndoListener);
      editorRef.current.addEventListener(imageFileDropEventName, handleImageFileDrop);

      return () => {
        editorRef.current?.removeEventListener(undoEventName, editorUndoListener);
        editorRef.current?.removeEventListener(imageFileDropEventName, handleImageFileDrop);
      };
    }
  }, [editorRef, editor, readOnly, inline, pageType, postId, pageId]);

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
      isLoadingRef.current = false;
    } else if (useSockets) {
      if (authResponse) {
        log.info('Init FidusEditor');
        fEditor = new FidusEditor({
          user,
          docId: pageId,
          enableSuggestionMode: enableSuggestions,
          onDocLoaded: () => {
            isLoadingRef.current = false;
          },
          onCommentUpdate: () => {
            mutate(getThreadsKey(pageId));
          },
          onParticipantUpdate
        });
        fEditor.init(_editor.view, authResponse.authToken, (event) => _onConnectionEvent(_editor, event));
      } else if (authError) {
        log.warn('Loading readonly mode of editor due to web socket failure', { error: authError });
        isLoadingRef.current = false;
        setEditorContent(_editor, initialContent);
      }
    } else if (pageId && readOnly) {
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

  useEffect(() => {
    /// wait for isLoadingRef.current so that we set meta after fiduseditor has init
    if (editor?.view && !isLoadingRef.current && !loadingPages && linksPluginKey) {
      // pass in a list of page paths and ids for the link component to check during input
      const pageMap = Object.entries(pages).reduce<Record<string, string>>((acc, [key, page]) => {
        if (page) {
          acc[page.path] = page.id;
        }
        return acc;
      }, {});

      if (!editor.view.isDestroyed) {
        editor.view.dispatch(
          editor.view.state.tr.setMeta(linksPluginKey, {
            pages: pageMap
          })
        );
      }
    }
  }, [!!editor?.view, isLoadingRef.current, loadingPages]);

  if (nodeViews.length > 0 && renderNodeViews == null) {
    throw new Error('When using nodeViews, you must provide renderNodeViews callback');
  }

  return (
    <EditorViewContext.Provider value={editor?.view as any}>
      {editor ? children : null}
      <div
        ref={editorRef}
        className={`bangle-editor-core ${readOnly ? 'readonly' : ''}${!isLoadingRef.current ? ' content-loaded' : ''}`}
        data-page-id={pageId}
        data-post-id={postId}
        style={{
          minHeight: showLoader && isLoadingRef.current ? '200px' : undefined
        }}
      >
        <StyledLoadingComponent isLoading={showLoader && isLoadingRef.current} />
        <div ref={renderRef} id={pageId} className={className} style={style} />
        {allowClickingFooter && (
          <div contentEditable='false' className='charm-empty-footer' onMouseDown={onClickEditorBottom} />
        )}
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

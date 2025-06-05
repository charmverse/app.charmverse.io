import { log } from '@charmverse/core/log';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';
import { styled, Box, Divider } from '@mui/material';
import { specRegistry } from '@packages/bangleeditor/specRegistry';
import type { CryptoCurrency, FiatCurrency } from '@packages/blockchain/connectors/chains';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { useRouter } from 'next/router';
import { Node } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CSSProperties, RefObject } from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import type { IPageSidebarContext } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { extractDeletedThreadIds } from 'lib/prosemirror/plugins/inlineComments/extractDeletedThreadIds';

import { BangleEditor as ReactBangleEditor } from './components/@bangle.dev/react/ReactEditor';
import { useEditorState } from './components/@bangle.dev/react/useEditorState';
import { BookmarkNodeView } from './components/bookmark/BookmarkNodeView';
import { ButtonNodeView } from './components/button/ButtonNodeView';
import Callout from './components/callout/components/Callout';
import { CryptoPriceNodeView } from './components/cryptoPrice/CryptoPriceNodeView';
import { EmojiPopup } from './components/emojiSuggest/EmojiPopup';
import { FarcasterFrameNodeView } from './components/farcasterFrame/components/FarcasterFrameNodeView';
import type { FrontendParticipant } from './components/fiduswriter/collab';
import { getSelectedChanges } from './components/fiduswriter/state_plugins/track';
import fiduswriterStyles from './components/fiduswriter/styles';
import type { ConnectionEvent } from './components/fiduswriter/ws';
import { File } from './components/file/File';
import FloatingMenu from './components/floatingMenu/FloatingMenu';
import * as iframe from './components/iframe';
import ResizableImage from './components/image/ResizableImage';
import { InlineCommentThread } from './components/inlineComment/components/InlineCommentThread';
import { InlineDatabase } from './components/inlineDatabase/components/InlineDatabase';
import InlineCommandPalette from './components/inlinePalette/components/InlineCommandPalette';
import { LinksPopup } from './components/link/LinksPopup';
import { LinkedPage } from './components/linkedPage/components/LinkedPage';
import { LinkedPagesPopup } from './components/linkedPage/components/LinkedPagesPopup';
import { Mention } from './components/mention/components/Mention';
import { MentionsPopup } from './components/mention/components/MentionsPopup';
import { NestedPage } from './components/nestedPage/components/NestedPage';
import { NFTNodeView } from './components/nft/NFTNodeView';
import type { CharmNodeViewProps } from './components/nodeView/nodeView';
import ResizablePDF from './components/pdf/ResizablePDF';
import { PollNodeView } from './components/poll/PollComponent';
import Quote from './components/quote/components/Quote';
import { RowActionsMenu } from './components/rowActions/RowActionsMenu';
import { SuggestionsPopup } from './components/suggestions/SuggestionPopup';
import { TableOfContents } from './components/tableOfContents/TableOfContents';
import { TweetNodeView } from './components/tweet/TweetNodeView';
import { VideoNodeView } from './components/video/VideoNodeView';
import {
  actionsPluginKey,
  charmEditorPlugins,
  emojiPluginKey,
  floatingMenuPluginKey,
  inlineCommentPluginKey,
  inlinePalettePluginKey,
  linkedPagePluginKey,
  linksPluginKey,
  mentionPluginKey,
  suggestionsPluginKey
} from './plugins';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}
const StyledReactBangleEditor = styled(ReactBangleEditor)<{
  colorMode?: 'dark';
  disablePageSpecificFeatures?: boolean;
  disableRowHandles?: boolean;
}>`
  position: relative;

  /** DONT REMOVE THIS STYLING */
  /** ITS TO MAKE SURE THE USER CAN DRAG PAST THE ACTUAL CONTENT FROM RIGHT TO LEFT AND STILL SHOW THE FLOATING MENU */
  left: -50px;

  ${({ colorMode }) =>
    colorMode === 'dark'
      ? `
          background-color: var(--input-bg);
          border: 1px solid var(--input-border);
          .loaded .ProseMirror[data-placeholder]::before {
            color: var(--primary-text);
            opacity: 0.5;
          }`
      : ''};

  ${({ disableRowHandles }) =>
    disableRowHandles
      ? `
      padding-left: 10px;
      padding-right: 10px;
    `
      : `/** DONT REMOVE THIS STYLING */
    div.ProseMirror.bangle-editor {
      padding-left: 50px;
      margin-right: -50px;
    }`}

  code {
    border-radius: 2px !important;
    background-color: ${({ theme }) => theme.palette.code.background};
    color: ${({ theme }) => theme.palette.code.color};
    display: inline-block;
    font-size: 85%;
    height: fit-content;
    tab-size: 4;
    caret-color: var(--primary-text);
  }

  pre code {
    color: inherit;
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
  }

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .charm-link:hover {
      cursor: pointer;
    }
  }

  hr {
    background-color: ${({ theme }) => theme.palette.background.light};
  }

  ${({ disablePageSpecificFeatures }) =>
    !disablePageSpecificFeatures &&
    `
    .charm-inline-comment span.active {
      background: rgba(255,212,0,0.14);
      border-bottom: 2px solid rgb(255, 212, 0);
      padding-bottom: 2px;

      // disable hover UX on ios which converts first click to a hover event
      @media (pointer: fine) {
        &:hover {
          background: rgba(255,212,0,0.56) !important;
        }
      }
      cursor: pointer;
    }
  `}

  ${fiduswriterStyles}
`;

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

type CharmEditorProps = {
  colorMode?: 'dark';
  content?: PageContent;
  autoFocus?: boolean;
  enableSuggestingMode?: boolean;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
  sidebarView?: IPageSidebarContext['activeView'];
  setSidebarView?: IPageSidebarContext['setActiveView'];
  disablePageSpecificFeatures?: boolean;
  isContentControlled?: boolean; // whether or not the parent component is controlling and updating the content
  enableVoting?: boolean;
  enableComments?: boolean;
  pageId?: string;
  postId?: string;
  containerWidth?: number;
  pageType?: PageType | 'post';
  pagePermissions?: PagePermissionFlags;
  onParticipantUpdate?: (participants: FrontendParticipant[]) => void;
  placeholderText?: string;
  focusOnInit?: boolean;
  disableRowHandles?: boolean;
  disableNestedPages?: boolean;
  onConnectionEvent?: (event: ConnectionEvent) => void;
  isPollOrVote?: boolean;
  disableMention?: boolean;
  allowClickingFooter?: boolean;
  disableVideo?: boolean;
  setEditorState?: (state: EditorState) => void; // this is used to pass the state to the suggestions sidebar
  threadIds?: string[];
  setCharmEditorView?: (view: EditorView | null) => void;
};

function CharmEditor({
  colorMode,
  enableSuggestingMode = false,
  content,
  onContentChange,
  style,
  readOnly = false,
  disablePageSpecificFeatures = false,
  isContentControlled = false,
  enableComments,
  enableVoting,
  pageId,
  postId,
  containerWidth,
  pageType,
  setEditorState,
  pagePermissions,
  placeholderText,
  focusOnInit,
  onParticipantUpdate,
  disableRowHandles = false,
  disableNestedPages = false,
  onConnectionEvent,
  disableMention = false,
  allowClickingFooter,
  disableVideo = false,
  sidebarView,
  setSidebarView,
  threadIds,
  setCharmEditorView
}: CharmEditorProps) {
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const { mutate } = useSWRConfig();
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser();

  const isTemplate = pageType ? pageType.includes('template') : false;
  const disableNestedPage = disablePageSpecificFeatures || enableSuggestingMode || isTemplate || disableNestedPages;
  const onThreadResolveDebounced = debounce((_pageId: string, doc: EditorState['doc'], prevDoc: EditorState['doc']) => {
    const deletedThreadIds = extractDeletedThreadIds(specRegistry.schema, doc, prevDoc);
    if (deletedThreadIds.length) {
      charmClient.comments
        .resolveMultipleThreads({
          threadIds: deletedThreadIds,
          pageId: _pageId
        })
        .then(() => {
          charmClient.comments
            .getThreads(_pageId)
            .then((_threads) => {
              mutate(`pages/${_pageId}/threads`, _threads);
            })
            .catch((err) => {
              log.warn(`Failed to fetch threads for page ${_pageId}`, err);
            });
        })
        .catch((err) => {
          log.warn('Failed to auto resolve threads', err);
        });
    }
  }, 1000);

  const sendPageEvent = useMemo(
    () =>
      throttle(() => {
        if (currentSpace && pageType && pageId) {
          if (enableSuggestingMode) {
            charmClient.track.trackAction('page_suggestion_created', {
              pageId,
              spaceId: currentSpace.id
            });
          } else {
            charmClient.track.trackAction('edit_page', {
              pageId,
              spaceId: currentSpace.id
            });
          }
        }
      }, 1000),
    [currentSpace, pageType, pageId, enableSuggestingMode]
  );

  const debouncedUpdate = useMemo(
    () =>
      debounce((view: EditorView, prevDoc?: EditorState['doc']) => {
        const doc = view.state.doc.toJSON() as PageContent;
        const rawText = view.state.doc.textContent as string;
        if (pageId && prevDoc) {
          onThreadResolveDebounced(pageId, view.state.doc, prevDoc);
        }
        if (onContentChange) {
          onContentChange({ doc, rawText });
        }
      }, 100),
    [onContentChange, pageId, onThreadResolveDebounced]
  );

  const editorRef = useRef<HTMLDivElement>(null);

  function onSelectionSet(state: EditorState) {
    // update state that triggers updates in the sidebar
    setEditorState?.(state);
    // expand the sidebar if the user is selecting a suggestion
    setSidebarView?.((currentView) => {
      if (currentView) {
        const selected = getSelectedChanges(state);
        const hasSelection = Object.values(selected).some((value) => value);
        if (hasSelection) {
          return 'suggestions';
        }
      }
      return currentView;
    });
  }

  function getPlugins() {
    return charmEditorPlugins({
      disableRowHandles,
      disableVideo,
      onContentChange: (view: EditorView, prevDoc: Node) => {
        debouncedUpdate(view, prevDoc);
        sendPageEvent();
        if (setCharmEditorView) {
          setCharmEditorView(view);
        }
      },
      placeholderText,
      onError(err) {
        showMessage(err.message, 'warning');
      },
      onSelectionSet,
      readOnly,
      disablePageSpecificFeatures,
      enableVoting,
      pageId,
      spaceId: currentSpace?.id,
      userId: user?.id,
      disableMention,
      threadIds
    });
  }

  const state = useEditorState({
    specRegistry,
    plugins: getPlugins(),
    initialValue: isContentControlled && content ? Node.fromJSON(specRegistry.schema, content) : undefined,
    dropCursorOpts: {
      color: 'var(--charmeditor-active)'
    }
  });

  useEffect(() => {
    if (editorRef.current) {
      const highlightedMentionId = router.query.mentionId;
      const voteId = router.query.voteId as string;
      if (highlightedMentionId && typeof window !== 'undefined') {
        setTimeout(() => {
          const highlightedMentionDomElement = window.document.getElementById(`user-${highlightedMentionId}`);
          if (highlightedMentionDomElement) {
            requestAnimationFrame(() => {
              highlightedMentionDomElement.scrollIntoView({
                behavior: 'smooth'
              });
              setUrlWithoutRerender(router.pathname, { mentionId: null });
            });
          }
        }, 250);
      }
      if (voteId && typeof window !== 'undefined') {
        setTimeout(() => {
          const voteDomElement = window.document.getElementById(`vote.${voteId}`);
          if (voteDomElement) {
            requestAnimationFrame(() => {
              voteDomElement.scrollIntoView({
                behavior: 'smooth'
              });
              setUrlWithoutRerender(router.pathname, { voteId: null });
            });
          }
        }, 250);
      }
    }
  }, [editorRef.current]);

  return (
    <StyledReactBangleEditor
      threadIds={threadIds}
      allowClickingFooter={allowClickingFooter}
      colorMode={colorMode}
      pageId={pageId}
      postId={postId}
      pageType={pageType}
      focusOnInit={focusOnInit}
      disablePageSpecificFeatures={disablePageSpecificFeatures}
      disableRowHandles={disableRowHandles}
      isContentControlled={isContentControlled}
      initialContent={content}
      enableSuggestions={enableSuggestingMode}
      linksPluginKey={linksPluginKey}
      onParticipantUpdate={onParticipantUpdate}
      trackChanges
      floatingMenuPluginKey={floatingMenuPluginKey}
      readOnly={readOnly}
      enableComments={enableComments}
      onConnectionEvent={onConnectionEvent}
      setCharmEditorView={setCharmEditorView}
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      editorRef={editorRef as RefObject<HTMLDivElement>}
      pmViewOpts={{
        editable: () => !readOnly,
        plugins: [],
        attributes: () => ({
          translate: readOnly ? 'yes' : 'no',
          class: 'bangle-editor',
          'data-test': 'charm-editor-input'
        })
      }}
      state={state}
      renderNodeViews={({ children: _children, ...props }) => {
        const allProps: CharmNodeViewProps = {
          ...props,
          pageId,
          pagePermissions,
          postId,
          readOnly,
          deleteNode: () => {
            const view = props.view;
            const tr = view.state.tr;
            const start = props.getPos();
            if (typeof start === 'number') {
              const end = start + props.node.nodeSize;
              tr.deleteRange(start, end);
              tr.deleteSelection();
              view.dispatch(tr);
            }
          }
        };

        switch (props.node.type.name) {
          case 'quote':
            return <Quote {...allProps}>{_children}</Quote>;
          case 'cryptoPrice': {
            const attrs = props.attrs as { base: null | CryptoCurrency; quote: null | FiatCurrency };
            return (
              <CryptoPriceNodeView
                view={allProps.view}
                getPos={allProps.getPos}
                readOnly={readOnly}
                base={attrs.base}
                quote={attrs.quote}
                onBaseCurrencyChange={(newBaseCurrency) => {
                  props.updateAttrs({
                    base: newBaseCurrency
                  });
                }}
                onQuoteCurrencyChange={(newQuoteCurrency) => {
                  props.updateAttrs({
                    quote: newQuoteCurrency
                  });
                }}
              />
            );
          }
          case 'farcasterFrame': {
            return <FarcasterFrameNodeView {...allProps} pageId={pageId} />;
          }
          case 'blockquote': {
            return <Callout {...allProps}>{_children}</Callout>;
          }
          case 'horizontalRule': {
            return (
              <Box display='flex' alignItems='center' height={30} sx={{ overflow: 'auto' }}>
                <Divider sx={{ width: '100%' }} />
              </Box>
            );
          }
          case 'image': {
            return <ResizableImage {...allProps} />;
          }
          case 'iframe': {
            // support old video nodes which piggybacked on iframe type
            if (props.node.attrs.type === 'video') {
              return disableVideo ? null : <VideoNodeView {...allProps} />;
            }
            return <iframe.Component {...allProps} />;
          }
          case 'mention': {
            return !disableMention && <Mention {...props}>{_children}</Mention>;
          }
          case 'page': {
            return <NestedPage {...props} />;
          }
          case 'linkedPage': {
            return <LinkedPage {...props} />;
          }
          case 'pdf': {
            return <ResizablePDF {...allProps} />;
          }
          case 'file': {
            return <File {...allProps} />;
          }
          case 'bookmark': {
            return <BookmarkNodeView {...allProps} />;
          }
          case 'button': {
            return <ButtonNodeView {...allProps} />;
          }
          case 'poll': {
            return <PollNodeView {...allProps} />;
          }
          case 'inlineDatabase': {
            return <InlineDatabase containerWidth={containerWidth} {...allProps} />;
          }
          case 'tableOfContents': {
            return <TableOfContents {...allProps} />;
          }
          case 'tweet': {
            return <TweetNodeView {...allProps} />;
          }
          case 'nft': {
            return <NFTNodeView {...allProps} />;
          }
          case 'video': {
            return disableVideo ? null : <VideoNodeView {...allProps} />;
          }
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu
        pageType={pageType}
        palettePluginKey={inlinePalettePluginKey}
        // disable comments in suggestions mode since they dont interact well
        enableComments={enableComments}
        enableVoting={enableVoting && !enableSuggestingMode && !isTemplate}
        pluginKey={floatingMenuPluginKey}
        pagePermissions={pagePermissions}
        linkedPagePluginKey={linkedPagePluginKey}
        disableNestedPage={disableNestedPage}
        pageId={pageId}
      />
      {!disableMention && <MentionsPopup pageId={pageId} pluginKey={mentionPluginKey} />}
      <LinkedPagesPopup pageId={pageId} pluginKey={linkedPagePluginKey} />
      <EmojiPopup pluginKey={emojiPluginKey} />
      {!readOnly && !disableRowHandles && <RowActionsMenu pluginKey={actionsPluginKey} />}
      <InlineCommandPalette
        linkedPagePluginKey={linkedPagePluginKey}
        disableNestedPage={disableNestedPage}
        palettePluginKey={inlinePalettePluginKey}
        enableVoting={enableVoting}
        pageId={pageId}
      />
      {!disablePageSpecificFeatures && (
        <span className='font-family-default'>
          <InlineCommentThread
            isCommentSidebarOpen={sidebarView === 'comments'}
            permissions={pagePermissions}
            pluginKey={inlineCommentPluginKey}
          />
          {currentSpace && pageId && (
            <SuggestionsPopup
              isSuggestionSidebarOpen={sidebarView === 'suggestions'}
              pageId={pageId}
              spaceId={currentSpace.id}
              pluginKey={suggestionsPluginKey}
              readOnly={!pagePermissions?.edit_content}
            />
          )}
          {currentSpace && pageId && <LinksPopup pluginKey={linksPluginKey} readOnly={readOnly} />}
        </span>
      )}
    </StyledReactBangleEditor>
  );
}

export default memo((props: CharmEditorProps) => (
  <ErrorBoundary>
    <CharmEditor {...props} />
  </ErrorBoundary>
));

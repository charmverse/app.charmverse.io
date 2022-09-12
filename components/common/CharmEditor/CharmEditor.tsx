import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { EditorState, EditorView, Node } from '@bangle.dev/pm';
import { useEditorState, useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { commands as trackChangesCommands, Commit, commitToJSON, getTrackPluginState, reset } from '@manuscripts/track-changes';
import { Box, Button, Divider, Slide } from '@mui/material';
import { PageType } from '@prisma/client';
import charmClient from 'charmClient';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import CommentsSidebar from 'components/[pageId]/DocumentPage/components/CommentsSidebar';
import SuggestionsSidebar, { smoosh } from 'components/[pageId]/DocumentPage/components/SuggestionsSidebar';
import PageInlineVotesList from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import { CryptoCurrency, FiatCurrency } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { IPageActionDisplayContext } from 'hooks/usePageActionDisplay';
import { useUser } from 'hooks/useUser';
import { silentlyUpdateURL } from 'lib/browser';
import { extractDeletedThreadIds } from 'lib/inline-comments/extractDeletedThreadIds';
import log from 'lib/log';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import debounce from 'lodash/debounce';
import { PageContent } from 'models';
import { CSSProperties, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import { v4 } from 'uuid';
import Callout from './components/callout';
import LayoutColumn from './components/columnLayout/Column';
import LayoutRow from './components/columnLayout/Row';
import { CryptoPrice } from './components/CryptoPrice';
import EmojiSuggest from './components/emojiSuggest';
import * as floatingMenu from './components/floatingMenu';
import * as iframe from './components/iframe';
import InlineCommentThread, * as inlineComment from './components/inlineComment';
import InlineDatabase from './components/inlineDatabase/components/InlineDatabase';
import InlinePalette, { plugins as inlinePalettePlugins } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import InlineVoteList from './components/inlineVote/components/InlineVoteList';
import Mention, { MentionSuggest } from './components/mention';
import NestedPage, { NestedPagesList } from './components/nestedPage';
import Placeholder from './components/Placeholder';
import Quote from './components/quote';
import ResizableImage from './components/ResizableImage';
import ResizablePDF from './components/ResizablePDF';
import RowActionsMenu from './components/rowActions';
import DevTools from './DevTools';
import { actionsPluginKey, charmEditorPlugins, emojiPluginKey, floatingMenuPluginKey, inlineCommentPluginKey, inlineVotePluginKey, mentionPluginKey, nestedPagePluginKey } from './plugins';
import { specRegistry } from './specRegistry';
import { checkForEmpty } from './utils';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
  suggestion: any
}

const StyledReactBangleEditor = styled(ReactBangleEditor)<{disablePageSpecificFeatures?: boolean, suggestMode?: boolean}>`
  position: relative;

  /** DONT REMOVE THIS STYLING */
  /** ITS TO MAKE SURE THE USER CAN DRAG PAST THE ACTUAL CONTENT FROM RIGHT TO LEFT AND STILL SHOW THE FLOATING MENU */
  left: -50px;

  /** DONT REMOVE THIS STYLING */
  div.ProseMirror.bangle-editor {
    padding-left: 50px;
    width: calc(100% + 50px);
  }

  code {
    border-radius: 2px !important;
    background-color: ${({ theme }) => theme.palette.code.background};
    color: ${({ theme }) => theme.palette.code.color};
    display: inline-block;
    font-size: 85%;
    height: fit-content;
    tab-size: 4;
    caret-color: black;
  }
  pre code {
    color: inherit;
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
  }

  hr {
    background-color: ${({ theme }) => theme.palette.background.light};
  }

  ${({ disablePageSpecificFeatures }) => !disablePageSpecificFeatures && `
    .charm-inline-comment.active {
      background: rgba(255,212,0,0.14);
      border-bottom: 2px solid rgb(255, 212, 0);
      padding-bottom: 2px;
      &:hover {
        background: rgba(255,212,0,0.56) !important;
      }
      cursor: pointer;
    }

    .charm-inline-vote {
      background: rgba(0,171,255,0.14);
      border-bottom: 2px solid rgb(0,171,255);
      padding-bottom: 2px;
      &:hover {
        background: rgba(0,171,255,0.56) !important;
      }
      cursor: pointer;
    }
  `}

  /** Don't highlight un-committed blames */
  .track-changes--blame:not(.track-changes--blame-uncommitted) {
    background-color: rgba(57, 255, 20, 0.3);
  }

  /** Only highlight them if the suggestion mode is on */
  ${({ suggestMode }) => suggestMode && `
    .track-changes--blame.track-changes--blame-uncommitted,.blame {
      background-color: rgba(255, 218, 20, 0.6);
    }
    .track-changes--blame.track-changes--focused {
      background-color: rgba(255, 218, 20, 0.6);
    }
  `}
`;

const PageActionListBox = styled.div`
  position: fixed;
  right: 0px;
  width: 416px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
  padding: 0 ${({ theme }) => theme.spacing(1)};
  background: ${({ theme }) => theme.palette.background.default};
`;

const defaultContent: PageContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph'
    }
  ]
};

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

interface CharmEditorProps {
  content?: PageContent;
  children?: ReactNode;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
  pageActionDisplay?: IPageActionDisplayContext['currentPageActionDisplay']
  disablePageSpecificFeatures?: boolean;
  enableVoting?: boolean;
  suggestion?: any | null;
  onSuggestModeChange?: () => void;
  pageId: string;
  containerWidth?: number;
  pageType?: PageType;
  pagePermissions?: IPagePermissionFlags;
}

export function convertPageContentToMarkdown (content: PageContent, title?: string): string {

  const serializer = markdownSerializer(specRegistry);

  const state = new BangleEditorState({
    specRegistry,
    initialValue: Node.fromJSON(specRegistry.schema, content) ?? ''
  });

  let markdown = serializer.serialize(state.pmState.doc);

  if (title) {
    const pageTitleAsMarkdown = `# ${title}`;

    markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
  }

  return markdown;
}

const hashString = (input: string) => {
  let hash = 0;

  if (input.length === 0) {
    return btoa('0');
  }

  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    hash = (hash << 7) - hash + charCode;
    hash &= hash;
  }
  return btoa(hash.toString());
};

export const getCommitID = (changeIDs: string[]): string => {
  return `MPCommit:${hashString(changeIDs.slice().sort().join())}`;
};

export const buildCommit = (
  data: Omit<Commit, '_id' | 'updatedAt' | 'createdAt'>
): Commit => {
  const changeIDs = data.prev
    ? [data.changeID, ...smoosh(data.prev, (c) => c.changeID)]
    : [data.changeID];

  return {
    _id: getCommitID(changeIDs),
    updatedAt: Date.now() / 1000,
    createdAt: Date.now() / 1000,
    ...data
  };
};

function SuggestModeToggleButton (
  { onSuggestModeChange, suggestMode, onSuggestModeToEditMode }:
  {suggestMode: boolean, onSuggestModeChange: () => void, onSuggestModeToEditMode: (view: EditorView) => void}
) {
  const view = useEditorViewContext();
  const { state, dispatch } = view;
  return (
    <Button onClick={() => {
      // Moving into suggest mode
      if (!suggestMode) {
        // Lock the current state as if no changes have been made
        view.updateState(reset(state.doc, state));
      }
      // Moving back to edit mode
      // Only create commit if we go from suggest mode -> edit mode
      if (suggestMode) {
        trackChangesCommands.freezeCommit()(state, dispatch, view);
        onSuggestModeToEditMode(view);
      }
      onSuggestModeChange();
    }}
    >{suggestMode ? 'Edit Mode' : 'Suggestion Mode'}
    </Button>
  );
}

function CharmEditor (
  {
    pageActionDisplay = null,
    content = defaultContent,
    children,
    onContentChange,
    style,
    readOnly = false,
    disablePageSpecificFeatures = false,
    enableVoting,
    pageId,
    suggestion = null,
    onSuggestModeChange,
    containerWidth,
    pageType,
    pagePermissions
  }:
  CharmEditorProps
) {
  const { mutate } = useSWRConfig();
  const [currentSpace] = useCurrentSpace();
  // check empty state of page on first load
  const _isEmpty = checkForEmpty(content);
  const [isEmpty, setIsEmpty] = useState(_isEmpty);
  const { user } = useUser();
  const [suggestMode, setSuggestMode] = useState(false);

  // eslint-disable-next-line
  const onThreadResolveDebounced = debounce((pageId: string, doc: EditorState['doc'], prevDoc: EditorState['doc']) => {
    const deletedThreadIds = extractDeletedThreadIds(
      specRegistry.schema,
      doc,
      prevDoc
    );
    if (deletedThreadIds.length) {
      charmClient.resolveMultipleThreads({
        threadIds: deletedThreadIds,
        pageId
      }).then(() => {
        charmClient.getPageThreads(pageId).then((threads) => {
          mutate(`pages/${pageId}/threads`, threads);
        }).catch((err) => {
          log.warn(`Failed to fetch threads for page ${pageId}`, err);
        });
      }).catch((err) => {
        log.warn('Failed to auto resolve threads', err);
      });
    }
  }, 1000);
  const onContentChangeDebounced = onContentChange ? debounce((view: EditorView, prevDoc?: EditorState['doc']) => {
    const doc = view.state.doc.toJSON() as PageContent;
    const rawText = view.state.doc.textContent as string;
    if (pageId && prevDoc) {
      onThreadResolveDebounced(pageId, view.state.doc, prevDoc);
    }

    const trackPluginState = getTrackPluginState(view.state);

    onContentChange({ doc, rawText, suggestion: commitToJSON(trackPluginState.commit, '') });

  }, 100) : undefined;

  function _onContentChange (view: EditorView, prevDoc: Node<any>) {
    // @ts-ignore missing types from the @bangle.dev/react package
    setIsEmpty(checkForEmpty(view.state.doc.toJSON() as PageContent));
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view, prevDoc);
    }
  }

  const editorRef = useRef<HTMLDivElement>(null);
  const jsonContent = content ? Node.fromJSON(specRegistry.schema, content) : '';
  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      suggestMode,
      readOnly,
      disablePageSpecificFeatures,
      enableVoting,
      pageId,
      spaceId: currentSpace?.id,
      userId: user?.id,
      content: content ? Node.fromJSON(specRegistry.schema, content) : undefined,
      suggestion,
      schema: specRegistry.schema
    }),
    initialValue: jsonContent,
    dropCursorOpts: {
      color: 'var(--charmeditor-active)'
    }
  });

  const onResizeStop = useCallback((view: EditorView) => {
    if (onContentChangeDebounced) {
      // Save the current embed size on the backend after we are done resizing
      onContentChangeDebounced(view);
    }
  }, [onContentChangeDebounced]);

  useEffect(() => {
    if (editorRef.current) {
      const highlightedMentionId = (new URLSearchParams(window.location.search)).get('mentionId');
      if (highlightedMentionId && typeof window !== 'undefined') {
        setTimeout(() => {
          const highlightedMentionDomElement = window.document.getElementById(`user-${highlightedMentionId}`);
          if (highlightedMentionDomElement) {
            requestAnimationFrame(() => {
              highlightedMentionDomElement.scrollIntoView({
                behavior: 'smooth'
              });
              // Remove the ?mentionId from url
              silentlyUpdateURL(window.location.href.split('?')[0]);
            });
          }
        }, 250);
      }
    }
  }, [editorRef.current]);

  return (
    <StyledReactBangleEditor
      suggestMode={suggestMode}
      disablePageSpecificFeatures={disablePageSpecificFeatures}
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      editorRef={editorRef}
      className={`czi-editor-frame-body ${isEmpty ? 'empty-editor' : ''}`}
      pmViewOpts={{
        editable: () => !readOnly,
        plugins: []
      }}
      placeholderComponent={(
        <Placeholder
          sx={{
            // This fixes the placeholder and cursor not being aligned
            top: -34
          }}
          show={isEmpty && !readOnly}
        />
      )}
      state={state}
      renderNodeViews={({ children: _children, ...props }) => {
        switch (props.node.type.name) {
          case 'quote':
            return <Quote {...props}>{_children}</Quote>;
          case 'columnLayout': {
            return <LayoutRow node={props.node}>{_children}</LayoutRow>;
          }
          case 'columnBlock': {
            return <LayoutColumn node={props.node}>{_children}</LayoutColumn>;
          }
          case 'cryptoPrice': {
            const attrs = props.attrs as { base: null | CryptoCurrency, quote: null | FiatCurrency };
            return (
              <CryptoPrice
                preset={{
                  base: attrs.base,
                  quote: attrs.quote
                }}
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
          case 'blockquote': {
            return (
              <Callout {...props}>
                {_children}
              </Callout>
            );
          }
          case 'horizontalRule': {
            return (
              <Box display='flex' alignItems='center' height={30} sx={{ overflow: 'auto' }}>
                <Divider sx={{ width: '100%' }} />
              </Box>
            );
          }
          case 'image': {
            return (
              <ResizableImage
                readOnly={readOnly}
                onResizeStop={onResizeStop}
                {...props}
              />
            );
          }
          case 'iframe': {
            return (
              <iframe.Component
                readOnly={readOnly}
                onResizeStop={onResizeStop}
                {...props}
              />
            );
          }
          case 'mention': {
            return (
              <Mention {...props}>
                {_children}
              </Mention>
            );
          }
          case 'page': {
            return (
              <NestedPage {...props} />
            );
          }
          case 'pdf': {
            return (
              <ResizablePDF
                readOnly={readOnly}
                onResizeStop={onResizeStop}
                {...props}
              />
            );
          }
          case 'inlineDatabase': {
            return (
              <InlineDatabase
                containerWidth={containerWidth}
                readOnly={readOnly}
                {...props}
              />
            );
          }
          default: {
            return null;
          }
        }
      }}
    >
      <SuggestModeToggleButton
        onSuggestModeChange={() => setSuggestMode(!suggestMode)}
        suggestMode={suggestMode}
        onSuggestModeToEditMode={(view: EditorView) => {
          onContentChangeDebounced?.(view);
        }}
      />
      <floatingMenu.FloatingMenu
        enableComments={!disablePageSpecificFeatures}
        enableVoting={enableVoting}
        pluginKey={floatingMenuPluginKey}
        pageType={pageType}
        pagePermissions={pagePermissions}
      />
      <MentionSuggest pluginKey={mentionPluginKey} />
      <NestedPagesList pluginKey={nestedPagePluginKey} />
      <EmojiSuggest pluginKey={emojiPluginKey} />
      {!readOnly && <RowActionsMenu pluginKey={actionsPluginKey} />}
      <InlinePalette nestedPagePluginKey={nestedPagePluginKey} disableNestedPage={disablePageSpecificFeatures} />
      {children}
      {!disablePageSpecificFeatures && (
        <>
          <Slide
            direction='left'
            in={pageActionDisplay === 'suggestions' && Boolean(suggestion)}
            style={{
              transformOrigin: 'left top'
            }}
            easing={{
              enter: 'ease-in',
              exit: 'ease-out'
            }}
            timeout={250}
          >
            <PageActionListBox id='page-suggestions-list-box'>
              <SuggestionsSidebar suggestion={suggestion} />
            </PageActionListBox>
          </Slide>
          <Slide
            direction='left'
            in={pageActionDisplay === 'comments'}
            style={{
              transformOrigin: 'left top'
            }}
            easing={{
              enter: 'ease-in',
              exit: 'ease-out'
            }}
            timeout={250}
          >
            <PageActionListBox id='page-thread-list-box'>
              <CommentsSidebar />
            </PageActionListBox>
          </Slide>
          <Slide
            direction='left'
            in={pageActionDisplay === 'votes'}
            style={{
              transformOrigin: 'left top'
            }}
            easing={{
              enter: 'ease-in',
              exit: 'ease-out'
            }}
            timeout={250}
          >
            <PageActionListBox
              id='page-vote-list-box'
            >
              <PageInlineVotesList />
            </PageActionListBox>
          </Slide>
          <InlineCommentThread pluginKey={inlineCommentPluginKey} />
          {enableVoting && <InlineVoteList pluginKey={inlineVotePluginKey} />}
        </>
      )}
      {!readOnly && <DevTools />}
    </StyledReactBangleEditor>
  );
}

export default memo((props: CharmEditorProps) => (
  <ErrorBoundary>
    <CharmEditor
      {...props}
    />
  </ErrorBoundary>
));

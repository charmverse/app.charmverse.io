import {
  bold,
  code,
  hardBreak,
  italic,
  link,
  strike,
  underline
} from '@bangle.dev/base-components';
import type { RawPlugins } from '@bangle.dev/core';
import { BangleEditorState, NodeView, Plugin } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import type { EditorState, EditorView } from '@bangle.dev/pm';
import { Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, Divider } from '@mui/material';
import type { PageType } from '@prisma/client';
import type { CryptoCurrency, FiatCurrency } from 'connectors';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';
import type { CSSProperties, ReactNode } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import CommentsSidebar from 'components/[pageId]/DocumentPage/components/CommentsSidebar';
import { SuggestionsSidebar } from 'components/[pageId]/DocumentPage/components/SuggestionsSidebar';
import PageInlineVotesList from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { IPageActionDisplayContext } from 'hooks/usePageActionDisplay';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useUser } from 'hooks/useUser';
import { extractDeletedThreadIds } from 'lib/inline-comments/extractDeletedThreadIds';
import log from 'lib/log';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { PageContent } from 'models';

import * as bulletList from './components/bulletList';
import Callout, * as callout from './components/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout';
import LayoutColumn from './components/columnLayout/Column';
import LayoutRow from './components/columnLayout/Row';
import { CryptoPrice } from './components/CryptoPrice';
import * as disclosure from './components/disclosure';
import EmojiSuggest, * as emoji from './components/emojiSuggest';
import * as floatingMenu from './components/floatingMenu';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import InlineCommentThread, * as inlineComment from './components/inlineComment';
import InlineDatabase from './components/inlineDatabase/components/InlineDatabase';
import InlineCommandPalette from './components/inlinePalette/components/InlineCommandPalette';
import { plugins as inlinePalettePlugins } from './components/inlinePalette/inlinePalette';
import * as inlineVote from './components/inlineVote';
import InlineVoteList from './components/inlineVote/components/InlineVoteList';
import * as listItem from './components/listItem/listItem';
import Mention, { mentionPluginKeyName, mentionPlugins, MentionSuggest } from './components/mention';
import NestedPage, { nestedPagePluginKeyName, nestedPagePlugins, NestedPagesList } from './components/nestedPage';
import * as orderedList from './components/orderedList';
import paragraph from './components/paragraph';
import Placeholder from './components/Placeholder';
import Quote from './components/quote';
import ResizableImage from './components/ResizableImage';
import ResizablePDF from './components/ResizablePDF';
import RowActionsMenu, * as rowActions from './components/rowActions';
import { SidebarDrawer, SIDEBAR_VIEWS } from './components/SidebarDrawer';
import { getSelectedChanges } from './components/suggestions/statePlugins/track';
import trackStyles from './components/suggestions/styles';
import SuggestionsPopup from './components/suggestions/SuggestionPopup';
import { plugins as trackPlugins } from './components/suggestions/suggestions.plugins';
import { rejectAll } from './components/suggestions/track/rejectAll';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';
import * as trailingNode from './components/trailingNode';
import { TweetComponent } from './components/tweet/components/Tweet';
import * as tweet from './components/tweet/tweet';
import DevTools from './DevTools';
import { specRegistry } from './specRegistry';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}

const actionsPluginKey = new PluginKey('row-actions');
const emojiPluginKey = new PluginKey(emoji.pluginKeyName);
const mentionPluginKey = new PluginKey(mentionPluginKeyName);
const floatingMenuPluginKey = new PluginKey('floatingMenu');
const nestedPagePluginKey = new PluginKey(nestedPagePluginKeyName);
const inlineCommentPluginKey = new PluginKey(inlineComment.pluginKeyName);
const inlineVotePluginKey = new PluginKey(inlineVote.pluginKeyName);
const suggestionsPluginKey = new PluginKey('suggestions');

export function charmEditorPlugins (
  {
    onContentChange,
    onSelectionSet,
    readOnly = false,
    disablePageSpecificFeatures = false,
    enableVoting,
    enableComments = true,
    userId = null,
    pageId = null,
    spaceId = null,
    username = null
  }:
    {
      spaceId?: string | null;
      pageId?: string | null;
      userId?: string | null;
      readOnly?: boolean;
      onContentChange?: (view: EditorView, prevDoc: EditorState['doc']) => void;
      onSelectionSet?: (state: EditorState) => void;
      disablePageSpecificFeatures?: boolean;
      enableVoting?: boolean;
      enableComments?: boolean;
      username?: string | null;
    } = {}
): () => RawPlugins[] {

  const basePlugins: RawPlugins[] = [
    // this trackPlugin should be called before the one below which calls onSelectionSet().
    // TODO: find a cleaner way to combine this logic?
    (username && userId ? trackPlugins({ readOnly, userId, username, onSelectionSet, key: suggestionsPluginKey }) : []),
    new Plugin({
      view: (_view) => {
        if (readOnly) {
          rejectAll(_view);
        }
        return {
          update: (view, prevState) => {
            if (!readOnly && onContentChange && !view.state.doc.eq(prevState.doc)) {
              onContentChange(view, prevState.doc);
            }
          }
        };
      }
    }),
    userDataPlugin({
      userId,
      pageId,
      spaceId
    }),
    nestedPagePlugins({
      key: nestedPagePluginKey
    }),
    imagePlugins({
      handleDragAndDrop: false
    }),
    mentionPlugins({
      key: mentionPluginKey
    }),
    inlinePalettePlugins(),
    bold.plugins(),
    bulletList.plugins(),
    code.plugins(),
    codeBlock.plugins(),
    hardBreak.plugins(),
    heading.plugins(),
    horizontalRule.plugins(),
    italic.plugins(),
    link.plugins(),
    listItem.plugins(),
    orderedList.plugins(),
    columnLayout.plugins(),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
    emoji.plugins({
      key: emojiPluginKey
    }),
    floatingMenu.plugins({
      key: floatingMenuPluginKey,
      readOnly,
      enableComments
    }),
    callout.plugins(),
    NodeView.createPlugin({
      name: 'image',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'horizontalRule',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'pdf',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'cryptoPrice',
      containerDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'iframe',
      containerDOM: ['div', { class: 'iframe-container', draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'quote',
      containerDOM: ['blockquote', { class: 'charm-quote' }],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'inlineDatabase',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    tabIndent.plugins(),
    table.tableEditing({ allowTableNodeSelection: true }),
    table.columnHandles(),
    table.columnResizing({}),
    // @ts-ignore missing type
    table.tablePopUpMenu(),
    // @ts-ignore missing type
    table.tableHeadersMenu(),
    // @ts-ignore missing type
    table.selectionShadowPlugin(),
    // @ts-ignore missing type
    table.TableFiltersMenu(),
    trailingNode.plugins(),
    disclosure.plugins(),
    tweet.plugins()
    // TODO: Pasting iframe or image link shouldn't create those blocks for now
    // iframePlugin,
    // pasteImagePlugin
  ];

  if (!readOnly) {
    basePlugins.push(rowActions.plugins({
      key: actionsPluginKey
    }));
  }

  if (!disablePageSpecificFeatures) {
    basePlugins.push(inlineComment.plugin({
      key: inlineCommentPluginKey
    }));
    if (enableVoting) {
      basePlugins.push(inlineVote.plugin({
        key: inlineVotePluginKey
      }));
    }
  }

  return () => basePlugins;
}

const StyledReactBangleEditor = styled(ReactBangleEditor)<{ disablePageSpecificFeatures?: boolean }>`
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

  ${trackStyles}
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
  enableSuggestingMode?: boolean;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
  pageActionDisplay?: IPageActionDisplayContext['currentPageActionDisplay'];
  disablePageSpecificFeatures?: boolean;
  enableVoting?: boolean;
  pageId: string;
  containerWidth?: number;
  pageType?: PageType;
  pagePermissions?: IPagePermissionFlags;
  placeholder?: JSX.Element | undefined | null;
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

function CharmEditor (
  {
    enableSuggestingMode = false,
    pageActionDisplay = null,
    content = defaultContent,
    children,
    onContentChange,
    style,
    readOnly = false,
    disablePageSpecificFeatures = false,
    enableVoting,
    pageId,
    containerWidth,
    pageType,
    pagePermissions,
    placeholder
  }:
  CharmEditorProps
) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const currentSpace = useCurrentSpace();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  // check empty state of page on first load
  const _isEmpty = checkIsContentEmpty(content);
  const [isEmpty, setIsEmpty] = useState(_isEmpty);
  const { user } = useUser();

  const isTemplate = pageType ? pageType.includes('template') : false;
  const disableNestedPage = disablePageSpecificFeatures || enableSuggestingMode || isTemplate;

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
    onContentChange({ doc, rawText });
  }, 100) : undefined;

  function _onContentChange (view: EditorView, prevDoc: Node<any>) {
    // @ts-ignore missing types from the @bangle.dev/react package
    setIsEmpty(checkIsContentEmpty(view.state.doc.toJSON() as PageContent));
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view, prevDoc);
    }
  }

  const editorRef = useRef<HTMLDivElement>(null);

  const [suggestionState, setSuggestionState] = useState<EditorState | null>(null);

  function onSelectionSet (state: EditorState) {
    // update state that triggers updates in the sidebar
    setSuggestionState(state);
    // expand the sidebar if the user is selecting a suggestion
    setCurrentPageActionDisplay(sidebarState => {
      if (sidebarState) {
        const selected = getSelectedChanges(state);
        const hasSelection = Object.values(selected).some((value) => value);
        if (hasSelection) {
          return 'suggestions';
        }
      }
      return sidebarState;
    });
  }

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      onSelectionSet,
      readOnly,
      disablePageSpecificFeatures,
      enableVoting,
      pageId,
      spaceId: currentSpace?.id,
      userId: user?.id,
      username: user?.username
    }),
    initialValue: content ? Node.fromJSON(specRegistry.schema, content) : '',
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
      const highlightedMentionId = router.query.mentionId;
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
    }
  }, [editorRef.current]);

  return (
    <StyledReactBangleEditor
      disablePageSpecificFeatures={disablePageSpecificFeatures}
      enableSuggestions={enableSuggestingMode}
      trackChanges={true}
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
        placeholder || (
          <Placeholder
            sx={{
              // This fixes the placeholder and cursor not being aligned
              top: -34
            }}
            show={isEmpty && !readOnly}
          />
        )
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
          case 'tweet': {
            return (
              <TweetComponent
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
      <floatingMenu.FloatingMenu
      // disable comments and polls in suggestions mode since they dont interact well
        enableComments={!disablePageSpecificFeatures && !enableSuggestingMode && !isTemplate}
        enableVoting={enableVoting && !enableSuggestingMode && !isTemplate}
        pluginKey={floatingMenuPluginKey}
        pagePermissions={pagePermissions}
        nestedPagePluginKey={nestedPagePluginKey}
        disableNestedPage={disableNestedPage}
      />
      <MentionSuggest pluginKey={mentionPluginKey} />
      <NestedPagesList pluginKey={nestedPagePluginKey} />
      <EmojiSuggest pluginKey={emojiPluginKey} />
      {!readOnly && <RowActionsMenu pluginKey={actionsPluginKey} />}
      <InlineCommandPalette nestedPagePluginKey={nestedPagePluginKey} disableNestedPage={disableNestedPage} />
      {children}
      {!disablePageSpecificFeatures && (
        <>
          <SidebarDrawer id='page-action-sidebar' title={pageActionDisplay ? SIDEBAR_VIEWS[pageActionDisplay].title : ''} open={!!pageActionDisplay}>
            {pageActionDisplay === 'suggestions' && <SuggestionsSidebar readOnly={!pagePermissions?.edit_content} state={suggestionState} />}
            {pageActionDisplay === 'comments' && <CommentsSidebar />}
            {pageActionDisplay === 'polls' && <PageInlineVotesList />}
          </SidebarDrawer>
          <InlineCommentThread pluginKey={inlineCommentPluginKey} />
          {enableVoting && <InlineVoteList pluginKey={inlineVotePluginKey} />}
          <SuggestionsPopup pluginKey={suggestionsPluginKey} readOnly={readOnly} />
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

import {
  bold,
  bulletList,
  code,
  hardBreak,
  heading,
  horizontalRule,
  italic,
  link,
  listItem,
  orderedList,
  strike,
  underline
} from '@bangle.dev/base-components';
import { BangleEditorState, NodeView, Plugin, RawPlugins } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { EditorState, EditorView, Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, Divider, Slide } from '@mui/material';
import charmClient from 'charmClient';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import CommentsSidebar from 'components/[pageId]/DocumentPage/components/CommentsSidebar';
import PageInlineVotesList from 'components/[pageId]/DocumentPage/components/VotesSidebar';
import { CryptoCurrency, FiatCurrency } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { IPageActionDisplayContext } from 'hooks/usePageActionDisplay';
import { useUser } from 'hooks/useUser';
import { silentlyUpdateURL } from 'lib/browser';
import { extractDeletedThreadIds } from 'lib/inline-comments/extractDeletedThreadIds';
import log from 'lib/log';
import debounce from 'lodash/debounce';
import { PageContent } from 'models';
import { CSSProperties, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import Callout, * as callout from './components/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout';
import LayoutColumn from './components/columnLayout/Column';
import LayoutRow from './components/columnLayout/Row';
import { CryptoPrice } from './components/CryptoPrice';
import * as disclosure from './components/disclosure';
import EmojiSuggest, * as emoji from './components/emojiSuggest';
import * as floatingMenu from './components/floatingMenu';
import * as iframe from './components/iframe';
import InlineCommentThread, * as inlineComment from './components/inlineComment';
import InlinePalette, { plugins as inlinePalettePlugins } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import InlineVoteList from './components/inlineVote/components/InlineVoteList';
import Mention, { mentionPluginKeyName, mentionPlugins, MentionSuggest } from './components/mention';
import NestedPage, { nestedPagePluginKeyName, nestedPagePlugins, NestedPagesList } from './components/nestedPage';
import paragraph from './components/paragraph';
import Placeholder from './components/Placeholder';
import Quote from './components/quote';
import ResizableImage from './components/ResizableImage';
import ResizablePDF from './components/ResizablePDF';
import RowActionsMenu, * as rowActions from './components/rowActions';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';
import * as trailingNode from './components/trailingNode';
import DevTools from './DevTools';
import { specRegistry } from './specRegistry';
import { checkForEmpty } from './utils';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
}

const actionsPluginKey = new PluginKey('row-actions');
const emojiPluginKey = new PluginKey(emoji.pluginKeyName);
const mentionPluginKey = new PluginKey(mentionPluginKeyName);
const floatingMenuPluginKey = new PluginKey('floatingMenu');
const nestedPagePluginKey = new PluginKey(nestedPagePluginKeyName);
const inlineCommentPluginKey = new PluginKey(inlineComment.pluginKeyName);
const inlineVotePluginKey = new PluginKey(inlineVote.pluginKeyName);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly,
    disablePageSpecificFeatures = false,
    enableVoting,
    enableComments = true,
    userId = null,
    pageId = null,
    spaceId = null
  }:
    {
      spaceId?: string | null,
      pageId?: string | null,
      userId?: string | null,
      readOnly?: boolean,
      onContentChange?: (view: EditorView, prevDoc: EditorState['doc']) => void,
      disablePageSpecificFeatures?: boolean,
      enableVoting?: boolean,
      enableComments?: boolean
    } = {}
): () => RawPlugins[] {

  const basePlugins: RawPlugins[] = [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view, prevState.doc);
          }
        }
      })
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
    disclosure.plugins()
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

const StyledReactBangleEditor = styled(ReactBangleEditor)<{disablePageSpecificFeatures?: boolean}>`
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
`;

const PageActionListBox = styled.div`
  position: fixed;
  right: 0px;
  width: 400px;
  top: 75px;
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
  margin-right: ${({ theme }) => theme.spacing(1)};
  background: ${({ theme }) => theme.palette.background.default};
  display: none;
  ${({ theme }) => theme.breakpoints.up('md')} {
    display: block;
  }
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
  pageId?: string | null;
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
    pageActionDisplay = null,
    content = defaultContent,
    children,
    onContentChange,
    style,
    readOnly = false,
    disablePageSpecificFeatures = false,
    enableVoting,
    pageId
  }:
  CharmEditorProps
) {
  const { mutate } = useSWRConfig();
  const [currentSpace] = useCurrentSpace();
  // check empty state of page on first load
  const _isEmpty = checkForEmpty(content);
  const [isEmpty, setIsEmpty] = useState(_isEmpty);
  const { user } = useUser();
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
    setIsEmpty(checkForEmpty(view.state.doc.toJSON() as PageContent));
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view, prevDoc);
    }
  }

  const editorRef = useRef<HTMLDivElement>(null);

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      readOnly,
      disablePageSpecificFeatures,
      enableVoting,
      pageId,
      spaceId: currentSpace?.id,
      userId: user?.id
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
          default: {
            return null;
          }
        }
      }}
    >
      <floatingMenu.FloatingMenu enableComments={!disablePageSpecificFeatures} enableVoting={enableVoting} pluginKey={floatingMenuPluginKey} />
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
          <PageActionListBox
            id='page-thread-list-box'
          >
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

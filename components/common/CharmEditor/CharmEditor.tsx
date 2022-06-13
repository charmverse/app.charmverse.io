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
  paragraph,
  strike,
  underline
} from '@bangle.dev/base-components';
import debounce from 'lodash/debounce';
import { NodeView, Plugin, SpecRegistry, BangleEditorState, RawPlugins } from '@bangle.dev/core';
import { EditorView, Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import { useState, CSSProperties, ReactNode, memo, useCallback } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import { PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'connectors';
import { markdownSerializer } from '@bangle.dev/markdown';
import PageThreadsList from 'components/[pageId]/DocumentPage/components/PageThreadsList';
import { Grow } from '@mui/material';
import FloatingMenu, { floatingMenuPlugin } from './components/FloatingMenu';
import Callout, * as callout from './components/callout';
import * as columnLayout from './components/columnLayout';
import LayoutColumn from './components/columnLayout/Column';
import LayoutRow from './components/columnLayout/Row';
import { CryptoPrice, cryptoPriceSpec } from './components/CryptoPrice';
import InlinePalette, { plugins as inlinePalettePlugins, spec as inlinePaletteSpecs } from './components/inlinePalette';
import EmojiSuggest, * as emoji from './components/emojiSuggest';
import NestedPage, { nestedPagePluginKeyName, nestedPagePlugins, NestedPagesList, nestedPageSpec } from './components/nestedPage';
import Placeholder from './components/Placeholder';
import Quote, * as quote from './components/quote';
import * as iframe from './components/iframe';
import ResizableImage, { imageSpec } from './components/ResizableImage';
import * as trailingNode from './components/trailingNode';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';
import RowActionsMenu, * as rowActions from './components/rowActions';
import { checkForEmpty } from './utils';
import * as disclosure from './components/disclosure';
import InlineCommentThread, * as inlineComment from './components/inlineComment';
import Paragraph from './components/Paragraph';
import Mention, { MentionSuggest, mentionPlugins, mentionSpecs, mentionPluginKeyName } from './components/mention';
import DevTools from './DevTools';

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

export const specRegistry = new SpecRegistry([
  // Comments to the right of each spec show if it supports markdown export
  // OK => Component exports markdown
  // ?? => Could not test component or identify it
  // NO => Not supported
  //
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  inlineComment.spec(),
  bold.spec(), // OK
  bulletList.spec(), // OK
  hardBreak.spec(), // OK
  horizontalRule.spec(), // OK
  italic.spec(), // OK
  link.spec(), // OK
  listItem.spec(), // OK
  orderedList.spec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emoji.specs(), // OK
  mentionSpecs(), // NO
  code.spec(), // OK
  codeBlock.spec(), // OK
  iframe.spec(), // OK
  heading.spec(), // OK
  inlinePaletteSpecs(), // Not required
  callout.spec(), // OK
  cryptoPriceSpec(), // NO
  imageSpec(), // OK
  columnLayout.rowSpec(), // NO
  columnLayout.columnSpec(), // NO
  nestedPageSpec(), // NO
  quote.spec(), // OK
  tabIndent.spec(),
  table.spec(), // OK - only for text content
  disclosure.spec()
]);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly,
    disabledPageSpecificFeatures = false,
    enableComments = true
  }:
    {
      readOnly?: boolean, onContentChange?: (view: EditorView) => void, disabledPageSpecificFeatures?: boolean, enableComments?: boolean
    } = {}
): () => RawPlugins[] {
  const basePlugins: RawPlugins[] = [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view);
          }
        }
      })
    }),
    nestedPagePlugins({
      key: nestedPagePluginKey
    }),
    imagePlugins({
      handleDragAndDrop: false
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
    mentionPlugins({
      key: mentionPluginKey
    }),
    floatingMenuPlugin({
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
      name: 'paragraph',
      containerDOM: ['p', { class: 'charm-paragraph' }],
      contentDOM: ['span']
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

  if (!disabledPageSpecificFeatures) {
    basePlugins.push(inlineComment.plugin({
      key: inlineCommentPluginKey
    }));
  }

  return () => basePlugins;
}

const StyledReactBangleEditor = styled(ReactBangleEditor)`
  position: relative;

  /** DONT REMOVE THIS STYLING */
  /** ITS TO MAKE SURE THE USER CAN DRAG PAST THE ACTUAL CONTENT FROM RIGHT TO LEFT AND STILL SHOW THE FLOATING MENU */
  left: -50px;

  min-width: 500px;

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

  .charm-inline-comment.active {
    background: rgba(255,212,0,0.14);
    border-bottom: 2px solid rgb(255, 212, 0);
    padding-bottom: 2px;
    &:hover {
      background: rgba(255,212,0,0.56) !important;
    }
    cursor: pointer;
  }
`;

const PageThreadListBox = styled.div`
  position: fixed;
  right: 0px;
  width: 400px;
  top: 75px;
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
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
  showingCommentThreadsList?: boolean
  disabledPageSpecificFeatures?: boolean
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
    showingCommentThreadsList = false,
    content = defaultContent,
    children,
    onContentChange,
    style,
    readOnly = false,
    disabledPageSpecificFeatures = false
  }:
  CharmEditorProps
) {
  // check empty state of page on first load
  const _isEmpty = checkForEmpty(content);
  const [isEmpty, setIsEmpty] = useState(_isEmpty);

  const onContentChangeDebounced = onContentChange ? debounce((view: EditorView) => {
    const doc = view.state.doc.toJSON() as PageContent;
    const rawText = view.state.doc.textContent as string;
    onContentChange({ doc, rawText });
  }, 100) : undefined;

  function _onContentChange (view: EditorView) {
    // @ts-ignore missing types from the @bangle.dev/react package
    setIsEmpty(checkForEmpty(view.state.doc.toJSON() as PageContent));
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view);
    }
  }

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      readOnly,
      disabledPageSpecificFeatures
    }),
    initialValue: content ? Node.fromJSON(specRegistry.schema, content) : '',
    // hide the black bar when dragging items - we dont even support dragging most components
    dropCursorOpts: {
      color: 'transparent'
    }
  });

  const onResizeStop = useCallback((view: EditorView<any>) => {
    if (onContentChangeDebounced) {
      // Save the current embed size on the backend after we are done resizing
      onContentChangeDebounced(view);
    }
  }, [onContentChangeDebounced]);

  return (
    <StyledReactBangleEditor
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
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
          case 'paragraph': {
            return (
              <Paragraph
                inlineCommentPluginKey={inlineCommentPluginKey}
                calculateInlineComments={!showingCommentThreadsList && !disabledPageSpecificFeatures}
                {...props}
              >{_children}
              </Paragraph>
            );
          }
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
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu enableComments={!disabledPageSpecificFeatures} pluginKey={floatingMenuPluginKey} />
      <MentionSuggest pluginKey={mentionPluginKey} />
      <NestedPagesList pluginKey={nestedPagePluginKey} />
      <EmojiSuggest pluginKey={emojiPluginKey} />
      {!readOnly && <RowActionsMenu pluginKey={actionsPluginKey} />}
      <InlinePalette nestedPagePluginKey={nestedPagePluginKey} disableNestedPage={disabledPageSpecificFeatures} />
      {children}
      {!disabledPageSpecificFeatures && (
      <Grow
        in={showingCommentThreadsList}
        style={{
          transformOrigin: 'left top'
        }}
        easing={{
          enter: 'ease-in',
          exit: 'ease-out'
        }}
        timeout={250}
      >
        <PageThreadListBox
          className='PageThreadListBox'
        >
          <PageThreadsList inline={false} />
        </PageThreadListBox>
      </Grow>
      )}
      {!disabledPageSpecificFeatures && <InlineCommentThread pluginKey={inlineCommentPluginKey} />}
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

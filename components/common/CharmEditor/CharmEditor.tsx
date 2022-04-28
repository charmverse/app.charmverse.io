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
import { NodeView, Plugin, SpecRegistry, BangleEditorState } from '@bangle.dev/core';
import { EditorView, Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import { useState, CSSProperties, ReactNode, memo, useCallback } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import { PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'models/Currency';
import { markdownSerializer } from '@bangle.dev/markdown';
import PageThreadsList from 'components/[pageId]/DocumentPage/components/PageThreadsList';
import { Box, Grow } from '@mui/material';
import FloatingMenu, { floatingMenuPlugin } from './components/FloatingMenu';
import Callout, * as callout from './components/callout';
import * as columnLayout from './components/columnLayout';
import LayoutColumn from './components/columnLayout/Column';
import LayoutRow from './components/columnLayout/Row';
import { CryptoPrice, cryptoPriceSpec } from './components/CryptoPrice';
import InlinePalette, { plugins as inlinePalettePlugins, spec as inlinePaletteSpecs } from './components/inlinePalette';
import EmojiSuggest, { plugins as emojiPlugins, specs as emojiSpecs } from './components/emojiSuggest';
import MentionSuggest, { Mention, mentionPlugins, mentionSpecs } from './components/Mention';
import NestedPage, { nestedPagePlugins, NestedPagesList, nestedPageSpec } from './components/nestedPage';
import Placeholder from './components/Placeholder';
import Quote, * as quote from './components/quote';
import ResizableIframe, { iframeSpec } from './components/ResizableIframe';
import ResizableImage, { imageSpec } from './components/ResizableImage';
import * as trailingNode from './components/trailingNode';
import * as tabIndent from './components/tabIndent';
import { suggestTooltipPlugins } from './components/@bangle.dev/tooltip/suggest-tooltip';
import * as table from './components/table';
import { checkForEmpty } from './utils';
import * as disclosure from './components/disclosure';
import InlineCommentThread, * as inlineComment from './components/inlineComment';
import Paragraph from './components/Paragraph';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
}

const emojiSuggestPluginKey = new PluginKey('emojiSuggest');
const mentionSuggestPluginKey = new PluginKey('mentionSuggest');
const floatingMenuPluginKey = new PluginKey('floatingMenu');

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
  emojiSpecs(), // ??
  mentionSpecs(), // NO
  code.spec(), // OK
  codeBlock.spec(), // OK
  iframeSpec(), // OK
  heading.spec(), // OK
  inlinePaletteSpecs(), // Not required
  // table, // OK
  // tableCell, // OK
  // tableHeader, // OK
  // tableRow, // OK
  callout.spec(), // OK
  cryptoPriceSpec(), // NO
  imageSpec(), // OK
  columnLayout.rowSpec(), // NO
  columnLayout.columnSpec(), // NO
  nestedPageSpec(), // NO
  quote.spec(), // OK
  tabIndent.spec(),
  table.spec(),
  disclosure.spec()
  // tables.tableNodes({
  //   cellAttributes: { },
  //   cellContent: 'My Cell',
  //   cellContentGroup: 'My Group'
  // })

]);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly
  }:
    {
      readOnly?: boolean, onContentChange?: (view: EditorView) => void
    } = {}
) {
  return () => [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view);
          }
        }
      })
    }),
    inlineComment.plugin(),
    suggestTooltipPlugins({
      tooltipRenderOpts: {
        placement: 'bottom'
      }
    }),
    nestedPagePlugins(),
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
    emojiPlugins({
      key: emojiSuggestPluginKey
    }),
    mentionPlugins({
      key: mentionSuggestPluginKey
    }),
    floatingMenuPlugin({
      key: floatingMenuPluginKey,
      readOnly
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
      name: 'page',
      containerDOM: ['div', { class: 'page-container' }]
    }),
    NodeView.createPlugin({
      name: 'quote',
      containerDOM: ['blockquote', { class: 'charm-quote' }],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'paragraph',
      containerDOM: ['p', { class: 'charm-paragraph' }],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'mention',
      containerDOM: ['span', { class: 'mention-value' }]
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
    // table.typesEnforcer(),
    // @ts-ignore missing type
    // table.TableDateMenu('MM/DD/YYYY'),
    // @ts-ignore missing type
    // table.TableLabelMenu(),
    // @ts-ignore missing type
    table.TableFiltersMenu(),
    trailingNode.plugins(),
    disclosure.plugins()
    // TODO: Pasting iframe or image link shouldn't create those blocks for now
    // iframePlugin,
    // pasteImagePlugin
  ];
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
    height: 100%;
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

  .charm-paragraph {
    display: flex;
    .bangle-nv-child-container {
      width: 100%;
    }
  }
`;

const PageThreadListBox = styled(Box)`
  position: fixed;
  right: 0px;
  width: 400px;
  top: 75px;
  z-index: 2000;
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
  { showingCommentThreadsList = false, content = defaultContent, children, onContentChange, style, readOnly = false }:
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
      readOnly
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
      className='czi-editor-frame-body'
      pmViewOpts={{
        editable: () => !readOnly
      }}
      placeholderComponent={<Placeholder show={isEmpty} />}
      state={state}
      renderNodeViews={({ children: _children, ...props }) => {

        switch (props.node.type.name) {
          case 'paragraph': {
            return <Paragraph calculateInlineComments={!showingCommentThreadsList} {...props}>{_children}</Paragraph>;
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
              <ResizableIframe
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
              <NestedPage {...props}>
                {_children}
              </NestedPage>
            );
          }
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu pluginKey={floatingMenuPluginKey} />
      <MentionSuggest pluginKey={mentionSuggestPluginKey} />
      <NestedPagesList />
      <EmojiSuggest pluginKey={emojiSuggestPluginKey} />
      <InlinePalette />
      {children}
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
      <InlineCommentThread />
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

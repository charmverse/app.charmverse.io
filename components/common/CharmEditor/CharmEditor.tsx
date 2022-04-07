import {
  blockquote,
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
import { NodeView, Plugin, SpecRegistry } from '@bangle.dev/core';
import { columnResizing, EditorView, Node } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tableRow } from '@bangle.dev/table';
import { useState, CSSProperties, ReactNode, memo, useCallback } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import { PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'models/Currency';
import FloatingMenu, { floatingMenuPlugin } from './components/FloatingMenu';
import { Callout, calloutSpec } from './components/Callout';
import ColumnBlock, { spec as columnBlockSpec } from './components/ColumnBlock';
import ColumnLayout, { spec as columnLayoutSpec } from './components/ColumnLayout';
import { CryptoPrice, cryptoPriceSpec } from './components/CryptoPrice';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './components/EmojiSuggest';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './components/InlinePalette';
import { Mention, mentionPlugins, mentionSpecs, MentionSuggest } from './components/Mention';
import { NestedPage, nestedPagePlugins, NestedPagesList, nestedPageSpec } from './components/NestedPage';
import Placeholder from './components/Placeholder';
import { Quote, quoteSpec } from './components/Quote';
import ResizableIframe, { iframeSpec } from './components/ResizableIframe';
import ResizableImage, { imageSpec } from './components/ResizableImage';
import * as tabIndent from './components/tabIndent';
import DocumentEnd from './components/DocumentEnd';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
}

export const specRegistry = new SpecRegistry([
  // Comments to the right of each spec show if it supports markdown export
  // OK => Component exports markdown
  // ?? => Could not test component or identify it
  // NO => Not supported
  //
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
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
  table, // OK
  tableCell, // OK
  tableHeader, // OK
  tableRow, // OK
  calloutSpec(), // OK
  cryptoPriceSpec(), // NO
  imageSpec(), // OK
  columnLayoutSpec(), // NO
  columnBlockSpec(), // NO ?? ==> Need to clarify how it fits into layout
  nestedPageSpec(), // NO
  quoteSpec(), // OK
  tabIndent.spec()
]);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly
  } :
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
    nestedPagePlugins({
      tooltipRenderOpts: {
        placement: 'bottom'
      }
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
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
    emojiPlugins(),
    mentionPlugins(),
    columnResizing,
    floatingMenuPlugin(readOnly),
    blockquote.plugins(),
    NodeView.createPlugin({
      name: 'blockquote',
      containerDOM: ['blockquote'],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'columnLayout',
      containerDOM: ['div'],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'columnBlock',
      containerDOM: ['div'],
      contentDOM: ['div']
    }),
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
      name: 'mention',
      containerDOM: ['span', { class: 'mention-value' }]
    }),
    tabIndent.plugins()
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
    border: none;
  }
`;

const defaultContent: PageContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
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
}

function CharmEditor (
  { content = defaultContent, children, onContentChange, style, readOnly = false }: CharmEditorProps
) {

  // check empty state of page on first load
  const _isEmpty = !content.content
    || content.content.length === 0
    || (content.content.length === 1 && !content.content[0].content?.length);

  const [isEmpty, setIsEmpty] = useState(_isEmpty);

  const onContentChangeDebounced = onContentChange ? debounce((view: EditorView) => {
    const doc = view.state.doc.toJSON() as PageContent;
    const rawText = view.state.doc.textContent as string;
    onContentChange({ doc, rawText });
  }, 100) : undefined;

  function _onContentChange (view: EditorView) {
    // @ts-ignore missing types from the @bangle.dev/react package
    const docContent: { content: { size: number } }[] = view.state.doc.content.content;
    const __isEmpty = docContent.length <= 1
      && (!docContent[0] || docContent[0].content.size === 0);
    setIsEmpty(__isEmpty);
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

  return (
    <StyledReactBangleEditor
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      pmViewOpts={{
        editable: () => !readOnly
      }}
      // Components that should be placed after the editor component
      postEditorComponents={<Placeholder show={isEmpty} />}
      state={state}
      renderNodeViews={({ children: NodeViewChildren, ...props }) => {

        switch (props.node.type.name) {
          case 'quote':
            return <Quote {...props}>{NodeViewChildren}</Quote>;
          case 'columnLayout': {
            return <ColumnLayout node={props.node}>{NodeViewChildren}</ColumnLayout>;
          }
          case 'columnBlock': {
            return <ColumnBlock node={props.node}>{NodeViewChildren}</ColumnBlock>;
          }
          case 'cryptoPrice': {
            const attrs = props.attrs as {base: null | CryptoCurrency, quote: null | FiatCurrency};
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
                {NodeViewChildren}
              </Callout>
            );
          }
          case 'image': {
            return (
              <ResizableImage
                readOnly={readOnly}
                onResizeStop={(view: EditorView<any>) => {
                  if (onContentChangeDebounced) {
                    // Save the current image size on the backend after we are done resizing
                    onContentChangeDebounced(view);
                  }
                }}
                {...props}
              />
            );
          }
          case 'iframe': {
            return (
              <ResizableIframe
                readOnly={readOnly}
                onResizeStop={(view) => {
                  if (onContentChangeDebounced) {
                    // Save the current embed size on the backend after we are done resizing
                    onContentChangeDebounced(view);
                  }
                }}
                {...props}
              />
            );
          }
          case 'mention': {
            return (
              <Mention {...props}>
                {NodeViewChildren}
              </Mention>
            );
          }
          case 'page': {
            return (
              <NestedPage {...props}>
                {NodeViewChildren}
              </NestedPage>
            );
          }
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu />
      <MentionSuggest />
      <NestedPagesList />
      {EmojiSuggest}
      {InlinePalette}
      {children}
      <DocumentEnd />
    </StyledReactBangleEditor>
  );
}

export default memo((props: CharmEditorProps) => (
  <ErrorBoundary>
    <CharmEditor {...props} />
  </ErrorBoundary>
));

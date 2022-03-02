import {
  blockquote,
  bold,
  bulletList,
  code,
  codeBlock,
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
import { NodeView, Plugin, SpecRegistry } from '@bangle.dev/core';
import { columnResizing, DOMOutputSpecArray, Node } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tableRow } from '@bangle.dev/table';
import styled from '@emotion/styled';
import { plugins as imagePlugins } from 'components/editor/@bangle.dev/base-components/image';
import { BangleEditor as ReactBangleEditor } from 'components/editor/@bangle.dev/react/ReactEditor';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'models/Currency';
import { CSSProperties, ReactNode } from 'react';
import { BlockQuote, blockQuoteSpec } from './BlockQuote';
import { Code } from './Code';
import ColumnBlock, { spec as columnBlockSpec } from './ColumnBlock';
import ColumnLayout, { spec as columnLayoutSpec } from './ColumnLayout';
import { CryptoPrice, cryptoPriceSpec } from './CryptoPrice';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './EmojiSuggest';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';
import { NestedPage, nestedPageSpec } from './NestedPage';
import Placeholder from './Placeholder';
import ResizableIframe, { iframeSpec } from './ResizableIframe';
import { imageSpec, ResizableImage } from './ResizableImage';
import { CollapsibleHeading, collapsibleHeadingSpec } from './CollapsibleHeading';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
}

const specRegistry = new SpecRegistry([
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  {
    type: 'node',
    name: 'paragraph',
    schema: {
      content: 'inline*',
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'p'
        }
      ],
      toDOM: (): DOMOutputSpecArray => ['p', 0]
    }
  },
  bold.spec(),
  bulletList.spec(),
  hardBreak.spec(),
  horizontalRule.spec(),
  italic.spec(),
  link.spec(),
  listItem.spec(),
  orderedList.spec(),
  strike.spec(),
  underline.spec(),
  emojiSpecs(),
  code.spec(),
  codeBlock.spec(),
  iframeSpec(),
  heading.spec(),
  inlinePaletteSpecs(),
  table,
  tableCell,
  tableHeader,
  tableRow,
  blockQuoteSpec(),
  cryptoPriceSpec(),
  imageSpec(),
  columnLayoutSpec(),
  columnBlockSpec(),
  nestedPageSpec(),
  collapsibleHeadingSpec()
]);

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
    padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    background-color: ${({ theme }) => theme.palette.code.background};
    font-size: 85%;
    color: ${({ theme }) => theme.palette.code.color};
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

export default function CharmEditor (
  { content = defaultContent, children, onPageContentChange, style, readOnly = false }:
  { content?: PageContent, children?: ReactNode, onPageContentChange?: UpdatePageContent, readOnly?: boolean,
    style?: CSSProperties }
) {
  const state = useEditorState({
    specRegistry,
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (onPageContentChange && !view.state.doc.eq(prevState.doc)) {
              onPageContentChange({
                doc: view.state.doc.toJSON() as PageContent,
                rawText: view.state.doc.textContent as string
              });
            }
          }
        })
      }),
      imagePlugins(),
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
      // tablePlugins(),
      columnResizing,
      floatingMenuPlugin(readOnly),
      blockquote.plugins(),
      NodeView.createPlugin({
        name: 'blockquote',
        containerDOM: ['blockquote'],
        contentDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'codeBlock',
        containerDOM: ['pre'],
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
        containerDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'cryptoPrice',
        containerDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'iframe',
        containerDOM: ['div', { class: 'iframe-container' }]
      }),
      NodeView.createPlugin({
        name: 'page',
        containerDOM: ['div', { class: 'page-container' }]
      }),
      NodeView.createPlugin({
        name: 'collapsibleHeading',
        containerDOM: ['div']
      })
      // TODO: Pasting iframe or image link shouldn't create those blocks for now
      // iframePlugin,
      // pasteImagePlugin
    ],
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
      postEditorComponents={<Placeholder />}
      state={state}
      renderNodeViews={({ children: NodeViewChildren, ...props }) => {
        switch (props.node.type.name) {
          case 'collapsibleHeading': {
            return <CollapsibleHeading {...props}>{NodeViewChildren}</CollapsibleHeading>;
          }
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
              <BlockQuote {...props}>
                {NodeViewChildren}
              </BlockQuote>
            );
          }
          case 'codeBlock': {
            return (
              <Code>
                {NodeViewChildren}
              </Code>
            );
          }
          case 'image': {
            return (
              <ResizableImage
                onResizeStop={(view) => {
                  if (onPageContentChange) {
                    // Save the current image size on the backend after we are done resizing
                    onPageContentChange({
                      doc: view.state.doc.toJSON() as PageContent,
                      rawText: view.state.doc.textContent as string
                    });
                  }
                }}
                {...props}
              />
            );
          }
          case 'iframe': {
            return (
              <ResizableIframe
                onResizeStop={(view) => {
                  if (onPageContentChange) {
                    // Save the current embed size on the backend after we are done resizing
                    onPageContentChange({
                      doc: view.state.doc.toJSON() as PageContent,
                      rawText: view.state.doc.textContent as string
                    });
                  }
                }}
                {...props}
              />
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
      {EmojiSuggest}
      {InlinePalette}
      {children}
    </StyledReactBangleEditor>
  );
}

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
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tableRow } from '@bangle.dev/table';
import styled from '@emotion/styled';
import { plugins as imagePlugins, spec as imageSpec } from 'components/editor/@bangle.dev/base-components/image';
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
import IFrame, { iframeSpec } from './Iframe';
import { Image } from './Image';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';
import Placeholder from './Placeholder';

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
  columnBlockSpec()
]);

const StyledReactBangleEditor = styled(ReactBangleEditor)`
  position: relative;

  code {
    padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    background-color: ${({ theme }) => theme.palette.code.background};
    font-size: 85%;
    color: ${({ theme }) => theme.palette.code.color};
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
      })
      // TODO: Pasting iframe or image link shouldn't create those blocks for now
      // iframePlugin,
      // pasteImagePlugin
    ],
    initialValue: Node.fromJSON(specRegistry.schema, content),
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
      state={state}
      renderNodeViews={({ children: NodeViewChildren, ...props }) => {
        switch (props.node.type.name) {
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
              <Image {...props}>
                {NodeViewChildren}
              </Image>
            );
          }
          case 'iframe': {
            return (
              <IFrame {...props}>
                {NodeViewChildren}
              </IFrame>
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
      <Placeholder />
    </StyledReactBangleEditor>
  );
}

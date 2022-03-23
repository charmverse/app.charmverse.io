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
import { columnResizing, DOMOutputSpecArray, Node } from '@bangle.dev/pm';
import { useEditorState, EditorViewContext } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tableRow } from '@bangle.dev/table';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { plugins as imagePlugins } from 'components/editor/@bangle.dev/base-components/image';
import * as codeBlock from 'components/editor/@bangle.dev/base-components/code-block';
import { BangleEditor as ReactBangleEditor } from 'components/editor/@bangle.dev/react/ReactEditor';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'models/Currency';
import { CSSProperties, ReactNode, memo } from 'react';
import { Callout, calloutSpec } from './Callout';
import ColumnBlock, { spec as columnBlockSpec } from './ColumnBlock';
import ColumnLayout, { spec as columnLayoutSpec } from './ColumnLayout';
import { CryptoPrice, cryptoPriceSpec } from './CryptoPrice';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './EmojiSuggest';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';
import { Mention, mentionPlugins, mentionSpecs, MentionSuggest } from './Mention';
import { NestedPage, nestedPagePlugins, NestedPagesList, nestedPageSpec } from './NestedPage';
import Placeholder from './Placeholder';
import { Quote, quoteSpec } from './Quote';
import ResizableIframe, { iframeSpec } from './ResizableIframe';
import { imageSpec, ResizableImage } from './ResizableImage';
import * as tabIndent from './tabIndent';

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
    onPageContentChange,
    readOnly
  } :
  {
    readOnly?: boolean, onPageContentChange?: (content: ICharmEditorOutput) => void
  } = {}
) {
  return () => [
    new Plugin({
      view: () => ({
        update: debounce((view, prevState) => {

          if (onPageContentChange && !view.state.doc.eq(prevState.doc)) {
            onPageContentChange({
              doc: view.state.doc.toJSON() as PageContent,
              rawText: view.state.doc.textContent as string
            });
          }
        }, 100)
      })

    }),
    nestedPagePlugins({
      tooltipRenderOpts: {
        placement: 'bottom'
      }
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
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    background-color: ${({ theme }) => theme.palette.code.background};
    font-size: 85%;
    tab-size: 4;
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
  onPageContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
}

function CharmEditor (
  { content = defaultContent, children, onPageContentChange, style, readOnly = false }: CharmEditorProps
) {

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({ onPageContentChange, readOnly }),
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
    </StyledReactBangleEditor>
  );
}

export default memo((props: CharmEditorProps) => (
  <ErrorBoundary>
    <CharmEditor {...props} />
  </ErrorBoundary>
));

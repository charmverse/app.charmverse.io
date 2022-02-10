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
import { NodeView, SpecRegistry } from '@bangle.dev/core';
import { columnResizing, Node } from '@bangle.dev/pm';
import { BangleEditor as ReactBangleEditor, EditorViewContext, useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tablePlugins, tableRow } from '@bangle.dev/table';
import '@bangle.dev/tooltip/style.css';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Emoji from 'components/common/Emoji';
import { plugins as imagePlugins, spec as imageSpec } from 'components/editor/@bangle.dev/base-components/image';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { Page, PageContent } from 'models';
import { CryptoCurrency, FiatCurrency } from 'models/Currency';
import { ChangeEvent, ReactNode, useContext, useRef } from 'react';
import { getSuggestTooltipKey } from './@bangle.dev/react-emoji-suggest/emoji-suggest';
import { BlockQuote, blockQuoteSpec } from './BlockQuote';
import { Code } from './Code';
import { CryptoPrice, cryptoPriceSpec } from './CryptoPrice';
import EmojiSuggest, { emojiPlugins, emojiSpecs, emojiSuggestKey } from './EmojiSuggest';
import { Image } from './Image';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';
import PageTitle from './Page/PageTitle';

const specRegistry = new SpecRegistry([
  cryptoPriceSpec(),
  imageSpec(),
  paragraph.spec(),
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
  heading.spec(),
  inlinePaletteSpecs(),
  table,
  tableCell,
  tableHeader,
  tableRow,
  blockQuoteSpec()
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

function EmojiContainer (
  { updatePageIcon, top, children }: { updatePageIcon: (icon: string) => void, children: ReactNode, top: number }
) {
  const view = useContext(EditorViewContext);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box
      sx={{
        width: 'fit-content',
        display: 'flex',
        position: 'absolute',
        top
      }}
      ref={ref}
      onClick={() => {
        if (view.dispatch!) {
          const suggestTooltipKey = getSuggestTooltipKey(emojiSuggestKey)(view.state);
          const suggestTooltipState = suggestTooltipKey.getState(view.state);

          // If the emoji suggest already has a ref attached its already visible, we need to hide it

          if (suggestTooltipState.show) {
            view.dispatch(
              view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
            );
          }
          else {
            view.dispatch(
              // Chain transactions together
              view.state.tr.setMeta(emojiSuggestKey, {
                type: 'INSIDE_PAGE_ICON',
                onClick: (emoji: string) => updatePageIcon(emoji),
                ref: ref.current,
                getPos: () => 0
              }).setMeta(suggestTooltipKey, { type: 'RENDER_TOOLTIP' }).setMeta('addToHistory', false)
            );
          }
        }
      }}
    >
      {children}
    </Box>
  );
}

export default function BangleEditor (
  { content, page, setPage }: { content: PageContent, page: Page, setPage: (p: Page) => void }
) {
  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
  }

  function updatePageIcon (icon: string) {
    setPage({ ...page, icon });
  }

  const state = useEditorState({
    specRegistry,
    plugins: () => [
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
      tablePlugins(),
      columnResizing,
      floatingMenuPlugin(),
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
        name: 'image',
        containerDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'cryptoPrice',
        containerDOM: ['div']
      })
    ],
    initialValue: Node.fromJSON(specRegistry.schema, content),
    // hide the black bar when dragging items - we dont even support dragging most components
    dropCursorOpts: {
      color: 'transparent'
    }
  });

  let pageTitleTop = 50; let bangleEditorTop = 75; let
    pageIconTop = 50;

  if (page.icon && !page.headerImage) {
    pageTitleTop = 100;
    bangleEditorTop = 125;
    pageIconTop = -75;
  }

  if (!page.icon && page.headerImage) {
    pageTitleTop = 50;
  }

  if (page.icon && page.headerImage) {
    pageTitleTop = 50;
    bangleEditorTop = 125;
    pageIconTop = -60;
  }

  return (
    <StyledReactBangleEditor
      style={{
        top: bangleEditorTop
      }}
      state={state}
      renderNodeViews={({ children, ...props }) => {
        // eslint-disable-next-line
        switch (props.node.type.name) {
          case 'cryptoPrice': {
            /* eslint-disable-next-line */
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
                {children}
              </BlockQuote>
            );
          }
          case 'codeBlock': {
            return (
              <Code>
                {children}
              </Code>
            );
          }
          case 'image': {
            return (
              <Image {...props}>
                {children}
              </Image>
            );
          }
          default: {
            return null;
          }
        }
      }}
    >
      {page.icon && (
        <EmojiContainer top={pageIconTop} updatePageIcon={updatePageIcon}>
          <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
        </EmojiContainer>
      )}
      <Box sx={{
        position: 'absolute',
        top: pageTitleTop
      }}
      >
        <PageTitle
          value={page.title}
          onChange={updateTitle}
        />
      </Box>
      <FloatingMenu />
      {EmojiSuggest}
      {InlinePalette}
    </StyledReactBangleEditor>
  );
}

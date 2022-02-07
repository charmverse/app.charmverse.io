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
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tablePlugins, tableRow } from '@bangle.dev/table';
import '@bangle.dev/tooltip/style.css';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Emoji from 'components/common/Emoji';
import { plugins as imagePlugins, spec as imageSpec } from 'components/editor/@bangle.dev/base-components/image';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { Page, PageContent } from 'models';
import { ChangeEvent } from 'react';
import { BlockQuote, blockQuoteSpec } from './BlockQuote';
import { Code } from './Code';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './EmojiSuggest';
import { Image } from './Image';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';

const specRegistry = new SpecRegistry([
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

const PageTitle = styled.input`
  background: transparent;
  border: 0 none;
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: text;
  font-size: 40px;
  font-weight: 700;
  outline: none;
`;

const EmojiContainer = styled(Box)`
  width: fit-content;
  display: flex;
  position: relative;
`;

export default function BangleEditor (
  { content, page, setPage }: { content: PageContent, page: Page, setPage: (p: Page) => void }
) {
  function updateTitle (event: ChangeEvent<HTMLInputElement>) {
    setPage({ ...page, title: event.target.value });
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
        contentDOM: ['span']
      }),
      NodeView.createPlugin({
        name: 'codeBlock',
        containerDOM: ['pre'],
        contentDOM: ['span']
      }),
      NodeView.createPlugin({
        name: 'image',
        containerDOM: ['div']
      })
    ],
    initialValue: Node.fromJSON(specRegistry.schema, content)
  });

  let pageTitleTop = 50; let bangleEditorTop = 75; let
    pageIconTop = 50;

  if (page.icon && !page.headerImage) {
    pageTitleTop = 100;
    bangleEditorTop = 125;
    pageIconTop = -150;
  }

  if (!page.icon && page.headerImage) {
    pageTitleTop = 50;
  }

  if (page.icon && page.headerImage) {
    pageTitleTop = 50;
    bangleEditorTop = 125;
    pageIconTop = -100;
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
        <EmojiContainer sx={{
          // If there are not page header image, move the icon a bit upward
          top: pageIconTop
        }}
        >
          <Emoji sx={{ fontSize: 78 }}>{page.icon}</Emoji>
        </EmojiContainer>
      )}
      <Box sx={{
        position: 'absolute',
        top: pageTitleTop
      }}
      >
        <PageTitle
          placeholder='Untitled'
          autoFocus
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

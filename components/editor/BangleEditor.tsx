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
import { styled } from '@mui/material';
import { plugins as imagePlugins, spec as imageSpec } from 'components/editor/@bangle.dev/base-components/image';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { PageContent } from 'models';
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
  code {
    padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    background-color: ${({ theme }) => theme.palette.code.background};
    font-size: 85%;
    color: ${({ theme }) => theme.palette.code.color};
  }
`;

export default function BangleEditor ({ content }: { content: PageContent }) {
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
        containerDOM: ['span']
      })
    ],
    initialValue: Node.fromJSON(specRegistry.schema, content)
  });

  return (
    <StyledReactBangleEditor
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
      <FloatingMenu />
      {EmojiSuggest}
      {InlinePalette}
    </StyledReactBangleEditor>
  );
}

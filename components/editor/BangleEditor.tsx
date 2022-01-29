import {
  blockquote,
  bold,
  bulletList,
  code,
  codeBlock,
  hardBreak,
  heading,
  horizontalRule,
  image,
  italic,
  link,
  listItem,
  orderedList,
  paragraph,
  strike,
  underline
} from '@bangle.dev/base-components';
import { NodeView, SpecRegistry } from '@bangle.dev/core';
import { markdownParser } from '@bangle.dev/markdown';
import { columnResizing } from '@bangle.dev/pm';
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import { table, tableCell, tableHeader, tablePlugins, tableRow } from "@bangle.dev/table";
import '@bangle.dev/tooltip/style.css';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { BlockQuote } from './BlockQuote';
import { Code } from './Code';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './EmojiSuggest';
import InlinePalette, { inlinePalettePlugins, inlinePaletteSpecs } from './InlinePalette';

const specRegistry = new SpecRegistry([
  blockquote.spec(),
  bold.spec(),
  bulletList.spec(),
  hardBreak.spec(),
  horizontalRule.spec(),
  image.spec(),
  italic.spec(),
  link.spec(),
  listItem.spec(),
  orderedList.spec(),
  paragraph.spec(),
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
  tableRow
]);
const parser = markdownParser(specRegistry);

export default function Editor({ markdown }: { markdown: string }) {
  const state = useEditorState({
    specRegistry,
    plugins: () => [
      inlinePalettePlugins(),
      blockquote.plugins(),
      bold.plugins(),
      bulletList.plugins(),
      code.plugins(),
      codeBlock.plugins(),
      hardBreak.plugins(),
      heading.plugins(),
      horizontalRule.plugins(),
      image.plugins(),
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
      NodeView.createPlugin({
        name: "blockquote",
        containerDOM: ["blockquote"],
        contentDOM: ["span"]
      }),
      NodeView.createPlugin({
        name: "codeBlock",
        containerDOM: ["pre"],
        contentDOM: ["span"]
      })
    ],
    initialValue: parser.parse(markdown),
  });

  return <ReactBangleEditor state={state} renderNodeViews={({ node, children }) => {
    switch (node.type.name) {
      case "blockquote": {
        return <BlockQuote>
          {children}
        </BlockQuote>
      }
      case "codeBlock": {
        return <Code>
          {children}
        </Code>
      }
    }
  }} >
    <FloatingMenu />
    {EmojiSuggest}
    {InlinePalette}
  </ReactBangleEditor>
}

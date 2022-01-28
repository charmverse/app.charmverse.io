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
import { SpecRegistry } from '@bangle.dev/core';
import '@bangle.dev/core/style.css';
import { markdownParser } from '@bangle.dev/markdown';
import { columnResizing } from '@bangle.dev/pm';
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import '@bangle.dev/react-menu/style.css';
import { table, tableCell, tableHeader, tablePlugins, tableRow } from "@bangle.dev/table";
import '@bangle.dev/tooltip/style.css';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
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
    ],
    initialValue: parser.parse(markdown),
  });

  return <ReactBangleEditor state={state}>
    <FloatingMenu />
    {EmojiSuggest}
    {InlinePalette}
  </ReactBangleEditor>
}

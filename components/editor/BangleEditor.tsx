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
import { columnResizing, EditorView, keymap } from '@bangle.dev/pm';
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import '@bangle.dev/react-menu/style.css';
import { table, tableCell, tableHeader, tablePlugins, tableRow } from "@bangle.dev/table";
import '@bangle.dev/tooltip/style.css';
import FloatingMenu, { floatingMenuPlugin } from 'components/editor/FloatingMenu';
import { paletteMarkName, palettePluginKey } from './@bangle.io/extensions/inline-command-palette/config';
import { InlineCommandPalette } from "./@bangle.io/extensions/inline-command-palette/InlineCommandPalette";
import { inlinePalette, queryInlinePaletteActive } from './@bangle.io/js-lib/inline-palette';
import { keybindings } from './@bangle.io/lib/config';
import EmojiSuggest, { emojiPlugins, emojiSpecs } from './EmojiSuggest';

const trigger = '/';

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
  inlinePalette.spec({ markName: paletteMarkName, trigger }),
  table,
  tableCell,
  tableHeader,
  tableRow
]);
const parser = markdownParser(specRegistry);

const getScrollContainer = (view: EditorView) => {
  return view.dom.parentElement!;
};

export default function Editor({ markdown }: { markdown: string }) {
  const state = useEditorState({
    specRegistry,
    plugins: () => [
      inlinePalette.plugins({
        key: palettePluginKey,
        markName: paletteMarkName,
        tooltipRenderOpts: {
          getScrollContainer,
          placement: "top-start"
        },
      }),
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
      keymap({
        [keybindings.toggleInlineCommandPalette.key]: (
          state,
          dispatch,
        ): boolean => {
          const { tr, schema, selection } = state;

          if (queryInlinePaletteActive(palettePluginKey)(state)) {
            return false;
          }
          const marks = selection.$from.marks();
          const mark = schema.mark(paletteMarkName, { trigger });

          const textBefore = selection.$from.nodeBefore?.text;
          // Insert a space so we follow the convention of <space> trigger
          if (textBefore && !textBefore.endsWith(' ')) {
            tr.replaceSelectionWith(schema.text(' '), false);
          }
          tr.replaceSelectionWith(
            schema.text(trigger, [mark, ...marks]),
            false,
          );
          dispatch?.(tr);
          return true;
        },
      }),
    ],
    initialValue: parser.parse(markdown),
  });

  return <ReactBangleEditor state={state}>
    <FloatingMenu />
    {EmojiSuggest}
    <InlineCommandPalette />
  </ReactBangleEditor>
}

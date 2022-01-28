import { EditorView, keymap } from '@bangle.dev/pm';
import { paletteMarkName, palettePluginKey } from './@bangle.io/extensions/inline-command-palette/config';
import { InlineCommandPalette as InlinePalette } from "./@bangle.io/extensions/inline-command-palette/InlineCommandPalette";
import { inlinePalette, queryInlinePaletteActive } from './@bangle.io/js-lib/inline-palette';
import { keybindings } from './@bangle.io/lib/config';

const getScrollContainer = (view: EditorView) => {
  return view.dom.parentElement!;
}

const trigger = '/';

export const inlinePaletteSpecs = () => {
  return inlinePalette.spec({ markName: paletteMarkName, trigger })
}

export const inlinePalettePlugins = () => {
  return [
    inlinePalette.plugins({
      key: palettePluginKey,
      markName: paletteMarkName,
      tooltipRenderOpts: {
        getScrollContainer,
        placement: "top-start"
      },
    }),
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
  ]
}

export default <InlinePalette />
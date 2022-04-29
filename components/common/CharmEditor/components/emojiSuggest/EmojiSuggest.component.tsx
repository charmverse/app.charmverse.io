import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Portal from '@mui/material/Portal';
import { BaseEmoji, Picker } from 'emoji-mart';
import { useCallback } from 'react';
import { PluginKey } from 'prosemirror-state';
import { selectEmoji } from './emojiSuggest.plugins';

export default function EmojiSuggest ({ pluginKey }: {pluginKey: PluginKey}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(pluginKey);

  const {
    show: isVisible
  } = usePluginState(suggestTooltipKey);

  const theme = useTheme();

  function closeTooltip () {
    if (view.dispatch) {
      view.dispatch(
        // Chain transactions together
        view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
      );
    }
  }

  const onSelectEmoji = useCallback(
    (emojiAlias: string) => {
      selectEmoji(pluginKey, emojiAlias)(view.state, view.dispatch, view);
      closeTooltip();
    },
    [view, pluginKey]
  );

  return isVisible && (
  <Portal container={tooltipContentDOM}>
    <ClickAwayListener onClickAway={closeTooltip}>
      <Picker
        theme={theme.palette.mode}
        onSelect={(emoji: BaseEmoji) => {
          onSelectEmoji(emoji.native);
        }}
      />
    </ClickAwayListener>
  </Portal>
  );
}

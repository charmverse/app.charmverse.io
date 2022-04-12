import { PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { BaseEmoji, Picker } from 'emoji-mart';
import { useCallback } from 'react';
import Portal from '@mui/material/Portal';
import { selectEmoji } from './EmojiSuggest.plugin';

export function EmojiSuggest ({
  emojiSuggestKey
}: {
  emojiSuggestKey: PluginKey;
}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(emojiSuggestKey);

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
      selectEmoji(emojiSuggestKey, emojiAlias)(view.state, view.dispatch, view);
      closeTooltip();
    },
    [view, emojiSuggestKey]
  );

  return isVisible && (
    <ClickAwayListener onClickAway={closeTooltip}>
      <Portal container={tooltipContentDOM}>
        <Picker
          theme={theme.palette.mode}
          onSelect={(emoji: BaseEmoji) => {
            onSelectEmoji(emoji.native);
          }}
        />
      </Portal>
    </ClickAwayListener>
  );
}

import { PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { selectEmoji } from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import { BaseEmoji, Picker } from 'emoji-mart';
import { useCallback } from 'react';

export function EmojiSuggest({
  emojiSuggestKey,
}: {
  emojiSuggestKey: PluginKey;
}) {
  const view = useEditorViewContext();
  const {
    suggestTooltipKey,
  } = usePluginState(emojiSuggestKey);

  const {
    show: isVisible,
  } = usePluginState(suggestTooltipKey);

  const theme = useTheme();
  
  function closeTooltip () {
    if (view.dispatch!) {
      view.dispatch(
        // Chain transactions together
        view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
      );
    }
  }

  const onSelectEmoji = useCallback(
    (emojiAlias: string) => {
      selectEmoji(emojiSuggestKey, emojiAlias)(view.state, view.dispatch, view);
      closeTooltip()
    },
    [view, emojiSuggestKey],
  );

  return isVisible && <ClickAwayListener onClickAway={closeTooltip}>
    <Picker
      theme={theme.palette.mode}
      onSelect={(emoji: BaseEmoji) => {
        onSelectEmoji(emoji.native);
      }}
    />
  </ClickAwayListener>
}
import data from '@emoji-mart/data';
import { useTheme, styled } from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import dynamic from 'next/dynamic';
import type { PluginKey } from 'prosemirror-state';
import { useCallback } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';

import { selectEmoji } from './emojiSuggest.plugins';

const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

const StyledPopper = styled(Popper)`
  z-index: var(--z-index-modal);
`;

export function EmojiPopup({ pluginKey }: { pluginKey: PluginKey }) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey);

  const { show: isVisible } = usePluginState(suggestTooltipKey);

  const theme = useTheme();

  function closeTooltip() {
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

  return (
    <ClickAwayListener onClickAway={closeTooltip}>
      <StyledPopper disablePortal open={isVisible} anchorEl={tooltipContentDOM} placement='bottom-start'>
        <Picker
          data={data}
          theme={theme.palette.mode}
          // ref: https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/packages/emoji-mart/src/components/Picker/Picker.tsx
          onEmojiSelect={(emoji: { native: string }) => {
            onSelectEmoji(emoji.native);
          }}
        />
      </StyledPopper>
    </ClickAwayListener>
  );
}

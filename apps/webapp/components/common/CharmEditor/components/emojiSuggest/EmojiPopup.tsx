import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import type { BaseEmoji } from 'emoji-mart';
import dynamic from 'next/dynamic';
import type { PluginKey } from 'prosemirror-state';
import { useCallback } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';

import { selectEmoji } from './emojiSuggest.plugins';

const Picker = dynamic(() => import('emoji-mart').then((r) => r.Picker), { ssr: false });

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
          theme={theme.palette.mode}
          onSelect={(emoji: BaseEmoji) => {
            onSelectEmoji(emoji.native);
          }}
        />
      </StyledPopper>
    </ClickAwayListener>
  );
}

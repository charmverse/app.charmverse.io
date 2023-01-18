import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined';
import { Box, ClickAwayListener, Grow, Typography } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { createPortal } from 'react-dom';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';

import type { LinkPluginState } from './link.plugins';

export function LinksPopup({ pluginKey, readOnly }: { pluginKey: PluginKey<LinkPluginState>; readOnly: boolean }) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, href } = usePluginState(pluginKey) as LinkPluginState;
  if (isVisible) {
    return createPortal(
      <ClickAwayListener
        onClickAway={() => {
          hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
        }}
      >
        <Grow
          in
          style={{
            transformOrigin: 'left top'
          }}
          easing={{
            enter: 'ease-in-out'
          }}
          timeout={250}
        >
          <Box
            sx={{ backgroundColor: 'background.light' }}
            display='flex'
            alignItems='center'
            flexDirection='row'
            gap={1}
            px={1}
            pt={0.5}
            pb={0.25}
            borderRadius={0.5}
          >
            <Typography variant='subtitle1' color='secondary'>
              {href}
            </Typography>
            <ContentPasteOutlinedIcon
              fontSize='small'
              sx={{
                fontSize: 14
              }}
            />
            {!readOnly && <Typography variant='subtitle1'>Edit</Typography>}
          </Box>
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

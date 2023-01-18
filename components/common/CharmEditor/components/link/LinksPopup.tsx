import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { Box, ClickAwayListener, Grow, IconButton, Stack, TextField, Typography } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import FieldLabel from 'components/common/form/FieldLabel';
import { useSnackbar } from 'hooks/useSnackbar';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';

import type { LinkPluginState } from './link.plugins';

export function LinksPopup({ pluginKey, readOnly }: { pluginKey: PluginKey<LinkPluginState>; readOnly: boolean }) {
  const { showMessage } = useSnackbar();
  const view = useEditorViewContext();
  const [linkView, setLinkView] = useState<'link-textfield' | 'options'>('options');
  const { tooltipContentDOM, show: isVisible, href } = usePluginState(pluginKey) as LinkPluginState;

  const [linkHref, setLinkHref] = useState(href);

  useEffect(() => {
    setLinkHref(href);
  }, [href]);

  function hideTooltip() {
    setLinkView('options');
    setLinkHref('');
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={hideTooltip}>
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
          {linkView === 'options' ? (
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
              <IconButton size='small'>
                <ContentCopyOutlinedIcon
                  sx={{
                    fontSize: 12
                  }}
                  onClick={() => {
                    hideTooltip();
                    navigator.clipboard.writeText(href);
                    showMessage('Link copied to clipboard');
                  }}
                />
              </IconButton>
              {!readOnly && (
                <Typography
                  sx={{
                    cursor: 'pointer'
                  }}
                  onClick={() => setLinkView('link-textfield')}
                  variant='subtitle1'
                >
                  Edit
                </Typography>
              )}
            </Box>
          ) : (
            <Stack
              p={1}
              sx={{
                backgroundColor: 'background.light'
              }}
            >
              <FieldLabel variant='subtitle2'>Link</FieldLabel>
              <TextField
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.code === 'Enter') {
                    hideTooltip();
                  }
                }}
              />
            </Stack>
          )}
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

// {!!onDelete && (
//   <Tooltip title={isDefaultSpacePostCategory ? 'You cannot delete the default post category' : ''}>
//     <div>
//       <MenuItem
//         disabled={isDefaultSpacePostCategory}
//         onClick={() => {
//           onDelete(category);
//         }}
//         sx={{
//           py: 1
//         }}
//       >
//         <ListItemIcon>
//           <DeleteOutlinedIcon fontSize='small' />
//         </ListItemIcon>
//         <Typography variant='subtitle1'>Delete</Typography>
//       </MenuItem>
//     </div>
//   </Tooltip>
// )}}

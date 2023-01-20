import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import {
  Box,
  ClickAwayListener,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Stack,
  TextField,
  Typography
} from '@mui/material';
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
  const { tooltipContentDOM, show: isVisible, href, ref } = usePluginState(pluginKey) as LinkPluginState;
  const [linkHref, setLinkHref] = useState(href);

  useEffect(() => {
    setLinkHref(href);
  }, [href]);

  function hideTooltip() {
    setLinkView('options');
    setLinkHref('');
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  function deleteHref() {
    if (ref) {
      const pmViewDesc = ref.pmViewDesc;
      const linkMarkType = view.state.schema.marks.link;
      if (pmViewDesc) {
        view.dispatch(view.state.tr.removeMark(pmViewDesc.posAtStart, pmViewDesc.posAtEnd, linkMarkType));
        hideTooltip();
      }
    }
  }

  function updateHref(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.code === 'Enter' && ref) {
      const pmViewDesc = ref.pmViewDesc;
      const linkMarkType = view.state.schema.marks.link;
      const updatedLinkMarkType = linkMarkType.create({
        href: linkHref
      });
      if (pmViewDesc) {
        view.dispatch(
          view.state.tr
            .removeMark(pmViewDesc.posAtStart, pmViewDesc.posAtEnd, linkMarkType)
            .addMark(pmViewDesc.posAtStart, pmViewDesc.posAtEnd, updatedLinkMarkType)
        );
        hideTooltip();
      }
    }
  }

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={hideTooltip}>
        {linkView === 'options' ? (
          <Box
            sx={{ backgroundColor: 'background.light' }}
            display='flex'
            alignItems='center'
            flexDirection='row'
            gap={0.5}
            px={1}
            pt={0.5}
            pb={0.25}
            borderRadius={0.5}
            onMouseLeave={() => {
              hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
            }}
          >
            <LanguageOutlinedIcon
              sx={{
                fontSize: 14
              }}
              color='secondary'
            />
            <Typography
              variant='subtitle1'
              color='secondary'
              sx={{
                display: 'block',
                maxWidth: 200,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {href}
            </Typography>
            <IconButton
              size='small'
              onClick={() => {
                hideTooltip();
                if (href) {
                  navigator.clipboard.writeText(href);
                }
                showMessage('Link copied to clipboard');
              }}
            >
              <ContentCopyOutlinedIcon
                sx={{
                  fontSize: 12
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
          <MenuList
            sx={{
              backgroundColor: 'background.light'
            }}
          >
            <Stack p={1}>
              <FieldLabel variant='subtitle2'>Link</FieldLabel>
              <TextField
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
                autoFocus
                onKeyDown={updateHref}
              />
            </Stack>
            <div>
              <MenuItem
                dense
                disabled={readOnly}
                onClick={deleteHref}
                sx={{
                  py: 1
                }}
              >
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Remove link</Typography>
              </MenuItem>
            </div>
          </MenuList>
        )}
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

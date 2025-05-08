import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import {
  Box,
  ClickAwayListener,
  IconButton,
  ListItemIcon,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { hideSuggestionsTooltip } from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import { isReturnKey } from '@packages/lib/utils/react';
import type { PluginKey } from 'prosemirror-state';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import FieldLabel from 'components/common/form/FieldLabel';
import { useSnackbar } from 'hooks/useSnackbar';

import type { LinkPluginState } from './link.plugins';

export function LinksPopup({ pluginKey, readOnly }: { pluginKey: PluginKey<LinkPluginState>; readOnly: boolean }) {
  const { showMessage } = useSnackbar();
  const view = useEditorViewContext();
  const [linkView, setLinkView] = useState<'link_display' | 'link_form'>('link_display');
  const { tooltipContentDOM, show: isVisible, href, ref } = usePluginState(pluginKey) as LinkPluginState;
  const [linkHref, setLinkHref] = useState(href);
  const [linkText, setLinkText] = useState('');
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (linkView === 'link_form' && ref) {
      setEditAnchor(ref);
    }
  });

  useEffect(() => {
    if (href) {
      setLinkHref(href);
    } else if (!editAnchor) {
      setLinkHref('');
    }
  }, [href, editAnchor]);

  useEffect(() => {
    if (!isVisible) {
      setLinkView('link_display');
    }
  }, [isVisible]);

  useEffect(() => {
    const pmViewDesc = editAnchor?.pmViewDesc;
    if (pmViewDesc) {
      const tr = view.state.tr;
      const { posAtStart, posAtEnd } = pmViewDesc;
      setLinkText(tr.doc.textBetween(posAtStart, posAtEnd));
    }
  }, [editAnchor]);

  function hideTooltip() {
    setLinkView('link_display');
    setLinkHref('');
    setLinkText('');
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  function deleteHref() {
    if (editAnchor) {
      const pmViewDesc = editAnchor.pmViewDesc;
      const linkMarkType = view.state.schema.marks.link;
      if (pmViewDesc) {
        view.dispatch(view.state.tr.removeMark(pmViewDesc.posAtStart, pmViewDesc.posAtEnd, linkMarkType));
        setEditAnchor(null);
        hideTooltip();
      }
    }
  }

  function updateLinkNode(e: React.KeyboardEvent) {
    e.stopPropagation();

    if (!editAnchor) {
      return;
    }

    const pmViewDesc = editAnchor.pmViewDesc;
    const linkMarkType = view.state.schema.marks.link;
    const updatedLinkMarkType = linkMarkType.create({
      href: linkHref
    });

    if (!pmViewDesc) {
      return;
    }

    const tr = view.state.tr;
    const { posAtStart, posAtEnd } = pmViewDesc;

    // update href
    view.dispatch(
      view.state.tr.removeMark(posAtStart, posAtEnd, linkMarkType).addMark(posAtStart, posAtEnd, updatedLinkMarkType)
    );

    // update link text
    if (linkText.length > 0) {
      view.state.doc.nodesBetween(posAtStart, posAtEnd, (node) => {
        if (node.type.name === 'text') {
          view.dispatch(tr.replaceWith(posAtStart, posAtEnd, view.state.schema.text(linkText, node.marks)));
        }
      });
    }
  }

  function updateLink(e: React.KeyboardEvent) {
    if (isReturnKey(e)) {
      updateLinkNode(e);

      // close edit popover on save
      setEditAnchor(null);
      hideTooltip();
    }
  }

  if (!isVisible && !editAnchor) {
    return null;
  }

  return (
    <>
      <Popover
        id='asd'
        open={!!editAnchor}
        anchorEl={editAnchor}
        onClose={() => setEditAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Paper
          sx={{
            minWidth: 350
          }}
        >
          <Stack p={1}>
            <FieldLabel variant='subtitle2'>Link</FieldLabel>
            <TextField
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
              autoFocus
              onKeyDown={updateLink}
            />
          </Stack>
          <Stack p={1}>
            <FieldLabel variant='subtitle2'>Text</FieldLabel>
            <TextField
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              autoFocus
              onKeyDown={updateLink}
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
        </Paper>
      </Popover>
      {isVisible &&
        createPortal(
          <ClickAwayListener onClickAway={hideTooltip}>
            <Box
              sx={{
                backgroundColor: 'background.light',
                border: '1px solid',
                borderColor: 'divider'
              }}
              display='flex'
              alignItems='center'
              flexDirection='row'
              gap={0.5}
              px={1}
              py={0.5}
              borderRadius={1}
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
                  onClick={(e) => {
                    setLinkView('link_form');
                    // keep content open
                    if (ref?.onmouseover) {
                      ref?.onmouseover(e.nativeEvent);
                    }
                  }}
                  variant='subtitle1'
                >
                  Edit
                </Typography>
              )}
            </Box>
          </ClickAwayListener>,
          tooltipContentDOM
        )}
    </>
  );
}

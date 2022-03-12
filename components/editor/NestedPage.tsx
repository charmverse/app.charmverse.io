import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, TextSelection } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import ActionsMenu from 'components/common/ActionsMenu';
import Snackbar from 'components/common/Snackbar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useNestedPage from 'hooks/useNestedPage';
import { usePages } from 'hooks/usePages';
import useSnackbar from 'hooks/useSnackbar';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { PageContent } from 'models';
import Link from 'next/link';

const name = 'page';

export function nestedPageSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      attrs: {
        path: {
          default: null
        },
        // This property is used to reference the page
        id: {
          default: null
        }
      },
      group: 'inline',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'page' }];
      }
    }
  };
}

export function NestedPage ({ node, getPos, view }: NodeViewProps) {
  const theme = useTheme();
  const [space] = useCurrentSpace();
  const { pages } = usePages();
  const { addNestedPage } = useNestedPage();
  const { message, handleClose, isOpen: isSnackbarOpen, showMessage } = useSnackbar();
  const nestedPage = pages[node.attrs.id];
  const popupState = usePopupState({ variant: 'popover', popupId: 'nested-page' });

  const docContent = ((nestedPage?.content) as PageContent)?.content;

  const isEditorEmpty = docContent && (docContent.length <= 1
  && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0));

  const transition = theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut
  });

  return (
    <Box
      display='flex'
      alignItems='center'
      gap={0.5}
      px={1}
      py={1}
      borderRadius={1}
      sx={{
        cursor: 'pointer',
        transition,
        position: 'relative',
        '&:hover': {
          backgroundColor: theme.palette.background.light,
          transition
        },
        '&:hover .actions-menu': {
          opacity: 1
        }
      }}
    >
      {nestedPage?.icon ? <div>{nestedPage.icon}</div> : (
        isEditorEmpty ? <InsertDriveFileOutlinedIcon /> : <DescriptionOutlinedIcon />
      )}
      <Link
        href={`/${(space!).domain}/${node.attrs.path}`}
        passHref
      >
        <Box fontWeight={600} component='div' width='100%'>
          {nestedPage?.title ? nestedPage.title : 'Untitled'}
        </Box>
      </Link>

      <ActionsMenu {...bindTrigger(popupState)} />

      <Menu
        {...bindMenu(popupState)}
      >
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            const pos = getPos();
            view.dispatch(view.state.tr.setSelection(
              TextSelection.create(view.state.doc, pos - 1, pos + 1)
            ));
            view.dispatch(view.state.tr.deleteSelection());
          }}
        >
          <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={addNestedPage}
        >
          <ListItemIcon>
            <ContentPasteIcon
              fontSize='small'
            />
          </ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Duplicate</Typography>
        </MenuItem>
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            // eslint-disable-next-line
            navigator.clipboard.writeText(`${location.origin}/${space?.domain}/${node.attrs.path}`);
            showMessage('Link copied');
          }}
        >
          <ListItemIcon>
            <LinkIcon
              fontSize='small'
            />
          </ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Copy Link</Typography>
        </MenuItem>
      </Menu>
      <Snackbar severity='info' handleClose={handleClose} isOpen={isSnackbarOpen} message={message ?? ''} />
    </Box>
  );
}

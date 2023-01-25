import { EditOutlined } from '@mui/icons-material';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import type { PageType } from '@prisma/client';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { humanFriendlyDate } from 'lib/utilities/dates';

import { Utils } from './BoardEditor/focalboard/src/utils';

export function PageActions({
  page,
  onClickDelete,
  onClickEdit,
  onClickDuplicate,
  children
}: {
  page: { createdBy: string; type?: PageType; id: string; updatedAt: Date; relativePath?: string; path: string };
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  onClickDuplicate?: VoidFunction;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const charmversePage = members.find((member) => member.id === page.createdBy);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function getPageLink() {
    let link = window.location.href;

    if (page.relativePath) {
      link = `${window.location.origin}${page.relativePath}`;
    } else {
      link = `${window.location.origin}/${router.query.domain}/${page.path}`;
    }
    return link;
  }

  function onClickCopyLink() {
    Utils.copyTextToClipboard(getPageLink());
    showMessage(`Copied ${page.type} link to clipboard`, 'success');
  }

  function onClickOpenInNewTab() {
    window.open(getPageLink());
  }

  return (
    <>
      <IconButton size='small' className='icons' onClick={handleClick}>
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleClose();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        open={open}
      >
        {onClickEdit && (
          <MenuItem dense onClick={onClickEdit}>
            <EditOutlined fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        <MenuItem dense onClick={onClickDelete} disabled={!onClickDelete}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        {onClickDuplicate && (
          <MenuItem dense onClick={onClickDuplicate}>
            <DuplicateIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
        )}
        <MenuItem dense onClick={onClickCopyLink}>
          <LinkIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={onClickOpenInNewTab}>
          <LaunchIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Open in new tab</ListItemText>
        </MenuItem>
        {children}
        <Divider />
        {charmversePage && (
          <Stack
            sx={{
              px: 2
            }}
          >
            <Typography variant='caption' color='secondary'>
              Last edited by {charmversePage.username}
            </Typography>
            <Typography variant='caption' color='secondary'>
              Last edited at {humanFriendlyDate(page.updatedAt)}
            </Typography>
          </Stack>
        )}
      </Menu>
    </>
  );
}

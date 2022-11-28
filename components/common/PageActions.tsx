import { EditOutlined } from '@mui/icons-material';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageMeta } from 'lib/pages';
import { humanFriendlyDate } from 'lib/utilities/dates';

import { Utils } from './BoardEditor/focalboard/src/utils';

type SupportedPageType = 'bounty' | 'card' | 'proposal';

const PageTypeQueryParamRecord: Record<SupportedPageType, string> = {
  card: 'cardId',
  bounty: 'bountyId',
  proposal: 'id'
};

export function PageActions({
  page,
  onClickDelete,
  onClickEdit,
  onClickDuplicate,
  children
}: {
  page: PageMeta;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  onClickDuplicate?: VoidFunction;
  children?: ReactNode;
}) {
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const pageCreator = members.find((member) => member.id === page.createdBy);
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

  const pageType = page.type as SupportedPageType;

  function onClickCopyLink() {
    let link = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get(PageTypeQueryParamRecord[pageType]) !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set(PageTypeQueryParamRecord[pageType], page.id);
      link = newUrl.toString();
    }

    Utils.copyTextToClipboard(link);
    showMessage(`Copied ${page.type} link to clipboard`, 'success');
  }

  function onClickOpenInNewTab() {
    let link = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get(PageTypeQueryParamRecord[pageType]) !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set(PageTypeQueryParamRecord[pageType], page.id);
      link = newUrl.toString();
    }

    window.open(link);
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
        {pageCreator && (
          <Stack
            sx={{
              px: 2
            }}
          >
            <Typography variant='caption' color='secondary'>
              Last edited by {pageCreator.username}
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

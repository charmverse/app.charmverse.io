import { EditOutlined } from '@mui/icons-material';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import { Divider, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import type { PageType } from '@prisma/client';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { usePostPermissions } from 'components/forum/hooks/usePostPermissions';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';

import { Utils } from './BoardEditor/focalboard/src/utils';

export function PageActionsMenu({
  children,
  onClickDelete,
  onClickEdit,
  onClickDuplicate,
  anchorEl,
  page,
  setAnchorEl,
  readOnly
}: {
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  children?: ReactNode;
  onClickDuplicate?: VoidFunction;
  setAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  anchorEl: HTMLElement | null;
  page: {
    createdBy: string;
    type?: PageType;
    id: string;
    updatedAt: Date;
    relativePath?: string;
    path: string;
    deletedAt: Date | null;
  };
  readOnly?: boolean;
}) {
  const { getPagePermissions } = usePages();
  const { members } = useMembers();
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const charmversePage = members.find((member) => member.id === page.createdBy);
  const open = Boolean(anchorEl);
  const { formatDateTime } = useDateFormatter();
  const pagePermissions = getPagePermissions(page.id);
  const postPermissions = usePostPermissions({
    postIdOrPath: router.pathname.startsWith('/[domain]/forum') ? page.id : (null as any)
  });
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

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
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
      {onClickEdit && !readOnly && (
        <MenuItem dense onClick={onClickEdit}>
          <EditOutlined fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        dense
        onClick={onClickDelete}
        disabled={Boolean(readOnly || (!pagePermissions?.delete && !postPermissions?.delete_post))}
        data-test='delete-page-from-context'
      >
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
            Last edited by <strong>{charmversePage.username}</strong>
          </Typography>
          <Typography variant='caption' color='secondary'>
            at <strong>{formatDateTime(page.updatedAt)}</strong>
          </Typography>
        </Stack>
      )}
    </Menu>
  );
}

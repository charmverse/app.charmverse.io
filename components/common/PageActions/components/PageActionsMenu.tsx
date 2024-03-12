import type { PageType } from '@charmverse/core/prisma';
import { EditOutlined } from '@mui/icons-material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePostPermissions } from 'hooks/usePostPermissions';

import { ArchiveProposalAction } from './ArchiveProposalAction';
import { CopyPageLinkAction } from './CopyPageLinkAction';
import { DuplicatePageAction } from './DuplicatePageAction';
import { PublishProposalAction } from './PublishProposalAction';

export type PageActionMeta = {
  proposalId: string | null;
  type?: PageType;
  id: string;
  updatedAt: Date;
  updatedBy: string;
  path: string;
  syncWithPageId?: string | null;
};

export function PageActionsMenu({
  children,
  onClickDelete,
  onClickEdit,
  anchorEl,
  page,
  setAnchorEl,
  readOnly
}: {
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  children?: ReactNode;
  setAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  anchorEl: HTMLElement | null;
  page: PageActionMeta;
  readOnly?: boolean;
}) {
  const { getMemberById } = useMembers();
  const router = useRouter();
  const member = getMemberById(page.updatedBy);
  const open = Boolean(anchorEl);
  const { formatDateTime } = useDateFormatter();
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: open ? page.id : null });
  const postPermissions = usePostPermissions({
    postIdOrPath: router.pathname.startsWith('/[domain]/forum') ? page.id : (null as any)
  });

  function getPageLink() {
    return `${window.location.origin}/${router.query.domain}/${page.path}`;
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
          <ListItemIcon>
            <EditOutlined fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        dense
        data-testid='delete-page-action'
        onClick={onClickDelete}
        disabled={Boolean(
          readOnly || (!pagePermissions?.delete && !postPermissions?.delete_post) || !!page.syncWithPageId
        )}
      >
        <ListItemIcon>
          <DeleteOutlineIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
      {page.proposalId && <ArchiveProposalAction proposalId={page.proposalId} />}
      {page.proposalId && <PublishProposalAction proposalId={page.proposalId} />}
      {page.type && (
        <DuplicatePageAction
          onComplete={handleClose}
          pageId={page.id}
          pageType={page.type}
          pagePermissions={pagePermissions}
        />
      )}
      <CopyPageLinkAction path={`/${page.path}`} />
      <MenuItem dense onClick={onClickOpenInNewTab}>
        <ListItemIcon>
          <LaunchIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Open in new tab</ListItemText>
      </MenuItem>
      {children}
      <Divider />
      {member && (
        <Stack
          sx={{
            px: 2
          }}
        >
          <Typography variant='caption' color='secondary'>
            Last edited by <strong>{member.username}</strong>
          </Typography>
          <Typography variant='caption' color='secondary'>
            at <strong>{formatDateTime(page.updatedAt)}</strong>
          </Typography>
        </Stack>
      )}
    </Menu>
  );
}

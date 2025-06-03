import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Box, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import Chip from '@mui/material/Chip';
import { credentialEventLabels } from '@packages/credentials/constants';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef } from 'react';

import { ContextMenu } from 'components/common/ContextMenu';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export function CredentialTemplateRow({
  template,
  onClickDelete,
  onClickEdit
}: {
  template: CredentialTemplate;
  onClickEdit: (template: CredentialTemplate) => void;
  onClickDelete: (templateId: string) => void;
}) {
  const { getFeatureTitle } = useSpaceFeatures();

  const isAdmin = useIsAdmin();

  const {
    isOpen,
    close,
    open: openDeleteDialog
  } = usePopupState({ variant: 'popover', popupId: 'credential-delete-popup' });

  const pageMenuAnchor = useRef(undefined);

  return (
    <Box display='flex' justifyContent='space-between'>
      <Box component='div' sx={{ alignItems: 'center', display: 'flex' }}>
        <MedalIcon />
        {template.name}
        <Box sx={{ ml: 2 }} gap={2} display='flex'>
          {template.credentialEvents.map((ev) => (
            <Chip key={ev} label={credentialEventLabels[ev]?.(getFeatureTitle)} variant='outlined' size='small' />
          ))}
        </Box>
      </Box>
      <Box ref={pageMenuAnchor} display='flex' alignSelf='stretch' alignItems='center'>
        <ContextMenu iconColor='secondary' popupId='credential-context'>
          <MenuItem
            data-test='edit-credential-template'
            disabled={!isAdmin}
            onClick={() => {
              onClickEdit(template);
            }}
          >
            <ListItemIcon>
              <EditOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary='Edit' />
          </MenuItem>
          <MenuItem data-test='delete-credential-template' disabled={!isAdmin} onClick={openDeleteDialog}>
            <ListItemIcon>
              <DeleteOutlineOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary='Delete' />
          </MenuItem>
        </ContextMenu>
      </Box>
      <ConfirmDeleteModal
        title='Delete credential template'
        question='Are you sure you want to delete this credential template?'
        onConfirm={() => onClickDelete(template.id)}
        onClose={close}
        open={isOpen}
      />
    </Box>
  );
}

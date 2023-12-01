import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { ColorSelectMenu } from 'components/common/form/ColorSelectMenu';
import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BrandColor } from 'theme/colors';

import { useProposalCategories } from '../../../hooks/useProposalCategories';

import { ProposalCategoryPermissionsDialog } from './ProposalCategoryPermissionsDialog/ProposalCategoryPermissionsDialog';

type Props = {
  category: ProposalCategoryWithPermissions;
};

export function ProposalCategoryContextMenu({ category }: Props) {
  const [tempName, setTempName] = useState(category.title || '');
  const [categoryColor, setCategoryColor] = useState<BrandColor>(category.color as BrandColor);
  const { space } = useCurrentSpace();
  const { mutateCategory, deleteCategory } = useProposalCategories();
  const { showMessage } = useSnackbar();

  const { permissions } = category;

  useEffect(() => {
    setTempName(category.title || '');
    setCategoryColor(category.color as BrandColor);
  }, [category.title, category.color]);

  useEffect(() => {
    if (category.color !== categoryColor && space) {
      charmClient.proposals
        .updateProposalCategory(space.id, { ...category, color: categoryColor })
        .then(mutateCategory);
    }
  }, [category, categoryColor, space]);

  function onSave() {
    if (tempName !== category.title && space) {
      charmClient.proposals.updateProposalCategory(space.id, { ...category, title: tempName }).then(mutateCategory);
    }
  }

  function onDelete() {
    if (space) {
      deleteCategory(category.id).catch((err) => {
        showMessage(err.message ?? 'Something went wrong', 'warning');
      });
    }
  }

  const [permissionsDialogIsOpen, setPermissionsDialogIsOpen] = useState(false);

  function closeDialog() {
    setPermissionsDialogIsOpen(false);
  }

  const popupContent = useMemo(
    () => (
      <MenuList>
        <Stack p={1}>
          <FieldLabel variant='subtitle2'>Category name</FieldLabel>
          <TextField
            disabled={!permissions.edit}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.code === 'Enter') {
                onSave();
              }
            }}
          />
        </Stack>
        {!!onDelete && (
          <Tooltip title={!permissions.delete ? 'You do not have permissions to delete this category' : ''}>
            <div>
              <MenuItem disabled={!permissions.delete} onClick={onDelete}>
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Delete</Typography>
              </MenuItem>
            </div>
          </Tooltip>
        )}

        <MenuItem
          data-test={`open-category-permissions-dialog-${category.id}`}
          onClick={() => setPermissionsDialogIsOpen(true)}
        >
          <ListItemIcon>
            <LockIcon />
          </ListItemIcon>
          <Typography variant='subtitle1' display='flex' gap={2} alignItems='center'>
            Permissions <UpgradeChip upgradeContext='proposal_permissions' />
          </Typography>
        </MenuItem>
        {permissions.edit && (
          <>
            <Divider />
            <ColorSelectMenu onChange={setCategoryColor} selectedColor={categoryColor} />
          </>
        )}
      </MenuList>
    ),
    [category, tempName, categoryColor, permissions.delete]
  );

  return (
    <>
      <PopperPopup popupContent={popupContent} onClose={onSave}>
        <IconButton data-test={`open-category-context-menu-${category.id}`} size='small' className='icons'>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>
      <ProposalCategoryPermissionsDialog
        permissions={permissions}
        onClose={closeDialog}
        open={permissionsDialogIsOpen}
        proposalCategory={category}
      />
    </>
  );
}

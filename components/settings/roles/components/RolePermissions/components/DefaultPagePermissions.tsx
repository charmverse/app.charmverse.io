import type { PagePermissionLevel } from '@charmverse/core/prisma';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, FormControlLabel, Menu, MenuItem, Switch, Typography } from '@mui/material';
import { typedKeys } from '@packages/utils/types';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { CustomRolesInfoModal } from 'components/settings/roles/CustomRolesInfoModal';
import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { pagePermissionLevels } from 'lib/permissions/pages/labels';

type PagePermissionLevelWithoutCustomAndProposalEditor =
  | Exclude<PagePermissionLevel, 'custom' | 'proposal_editor'>
  | 'none';
const pagePermissionDescriptions: Record<PagePermissionLevelWithoutCustomAndProposalEditor, string> = {
  full_access: 'Space members can edit pages, share them with the public and manage permissions',
  editor: 'Space members can edit but not share pages',
  view_comment: 'Space members can view and comment on pages',
  view: 'Space members can only view pages',
  none: 'Pages are private to authors by default'
};

const pagePermissionLabelsWithNone = {
  ...pagePermissionLevels,
  none: 'None'
};

export function DefaultPagePermissions() {
  const { space } = useCurrentSpace();
  const { setSpace } = useSpaces();
  const { isFreeSpace } = useIsFreeSpace();
  const rolesInfoPopup = usePopupState({ variant: 'popover', popupId: 'role-info-popup' });
  const [isUpdatingPagePermission, setIsUpdatingPagePermission] = useState(false);

  const isAdmin = useIsAdmin();
  const [touched, setTouched] = useState<boolean>(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'workspace-default-page-permission' });

  // Permission states
  const [selectedPagePermission, setSelectedPagePermission] =
    useState<PagePermissionLevelWithoutCustomAndProposalEditor>(
      space?.defaultPagePermissionGroup as PagePermissionLevelWithoutCustomAndProposalEditor
    );
  const [defaultPublicPages, setDefaultPublicPages] = useState<boolean>(space?.defaultPublicPages ?? false);
  const [requireProposalTemplate, setRequireProposalTemplate] = useState<boolean>(
    space?.requireProposalTemplate ?? false
  );

  const settingsChanged =
    space?.defaultPublicPages !== defaultPublicPages ||
    selectedPagePermission !== space?.defaultPagePermissionGroup ||
    space?.requireProposalTemplate !== requireProposalTemplate;

  async function updateSpaceDefaultPagePermission() {
    if (space && selectedPagePermission !== space?.defaultPagePermissionGroup) {
      setIsUpdatingPagePermission(true);
      const updatedSpace = await charmClient.permissions.spaces.setDefaultPagePermission({
        spaceId: space.id,
        pagePermissionLevel: selectedPagePermission === 'none' ? null : selectedPagePermission
      });
      setSpace(updatedSpace);
      setIsUpdatingPagePermission(false);
      popupState.close();
    }
  }

  async function updateSpaceDefaultPublicPages() {
    if (space && defaultPublicPages !== space?.defaultPublicPages) {
      const updatedSpace = await charmClient.spaces.setDefaultPublicPages({
        defaultPublicPages,
        spaceId: space.id
      });

      setSpace(updatedSpace);
    }
  }

  function updateSpaceDefaults() {
    updateSpaceDefaultPagePermission();
    updateSpaceDefaultPublicPages();
    setTouched(false);
  }

  usePreventReload(touched);

  if (!space) {
    return null;
  }

  return (
    <>
      <Box mb={2}>
        <Typography fontWeight='bold' display='flex' alignItems='center' gap={2}>
          Default permissions for new pages
        </Typography>
        <Typography variant='caption'>
          This applies to top-level pages only. Subpages will inherit permissions from their parent.
        </Typography>
      </Box>
      <Box mb={2} display='flex' alignItems='center' justifyContent='space-between'>
        <Typography>Default page permission for members</Typography>
        <UpgradeWrapper upgradeContext='page_permissions' onClick={rolesInfoPopup.open}>
          <Box display='flex' gap={1} alignItems='center'>
            <Button
              color='secondary'
              variant='outlined'
              disabled={isUpdatingPagePermission || !isAdmin || isFreeSpace}
              loading={isUpdatingPagePermission}
              endIcon={!isUpdatingPagePermission && <KeyboardArrowDownIcon fontSize='small' />}
              {...bindTrigger(popupState)}
            >
              {isFreeSpace
                ? pagePermissionLevels.editor
                : selectedPagePermission === null
                  ? pagePermissionLabelsWithNone.none
                  : pagePermissionLabelsWithNone[selectedPagePermission]}
            </Button>
          </Box>
        </UpgradeWrapper>
      </Box>

      <FormControlLabel
        sx={{
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between'
        }}
        control={
          <UpgradeWrapper upgradeContext='page_permissions' onClick={rolesInfoPopup.open}>
            <Box display='flex' gap={5.5} alignItems='center'>
              <Switch
                disabled={!isAdmin || isFreeSpace}
                onChange={(ev) => {
                  if (!isFreeSpace) {
                    const { checked: publiclyAccessible } = ev.target;
                    setDefaultPublicPages(publiclyAccessible);
                    setTouched(true);
                  }
                }}
                defaultChecked={defaultPublicPages || isFreeSpace}
              />
            </Box>
          </UpgradeWrapper>
        }
        label='Accessible to public'
        labelPlacement='start'
      />
      {isAdmin && (
        <Button
          onClick={() => updateSpaceDefaults()}
          disabled={!settingsChanged || isUpdatingPagePermission}
          type='submit'
          variant='contained'
          color='primary'
          size='small'
          sx={{ mt: 2 }}
        >
          Save
        </Button>
      )}
      <Menu
        {...bindMenu(popupState)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        {typedKeys(pagePermissionDescriptions).map((permissionLevel) => {
          const permissionLevelLabel = pagePermissionLabelsWithNone[permissionLevel];
          const isSelected = selectedPagePermission === permissionLevel;
          const description = pagePermissionDescriptions[permissionLevel];

          return (
            <MenuItem
              key={permissionLevel}
              selected={isSelected}
              onClick={() => {
                setSelectedPagePermission(permissionLevel);
                popupState.close();
                setTouched(true);
              }}
            >
              <StyledListItemText primary={permissionLevelLabel} secondary={description} />
            </MenuItem>
          );
        })}
      </Menu>
      <CustomRolesInfoModal isOpen={rolesInfoPopup.isOpen} onClose={rolesInfoPopup.close} />
    </>
  );
}

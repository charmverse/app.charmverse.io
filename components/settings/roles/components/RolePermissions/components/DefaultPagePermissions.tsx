import type { PagePermissionLevel } from '@charmverse/core/prisma';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, FormControlLabel, Menu, MenuItem, Switch, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { pagePermissionLevels } from 'lib/permissions/pages/labels';
import { typedKeys } from 'lib/utilities/objects';

type PagePermissionLevelWithoutCustomAndProposalEditor = Exclude<PagePermissionLevel, 'custom' | 'proposal_editor'>;
const pagePermissionDescriptions: Record<PagePermissionLevelWithoutCustomAndProposalEditor, string> = {
  full_access: 'Space members can edit pages, share them with the public and manage permissions.',
  editor: 'Space members can edit but not share pages.',
  view_comment: 'Space members can view and comment on pages.',
  view: 'Space members can only view pages.'
};
export function DefaultPagePermissions() {
  const space = useCurrentSpace();
  const { setSpace } = useSpaces();

  const [isUpdatingPagePermission, setIsUpdatingPagePermission] = useState(false);

  const isAdmin = useIsAdmin();
  const [touched, setTouched] = useState<boolean>(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'workspace-default-page-permission' });

  // Permission states
  const [selectedPagePermission, setSelectedPagePermission] =
    useState<PagePermissionLevelWithoutCustomAndProposalEditor>(
      (space?.defaultPagePermissionGroup as PagePermissionLevelWithoutCustomAndProposalEditor) ?? 'full_access'
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
        pagePermissionLevel: selectedPagePermission
      });
      setSpace(updatedSpace);
      setIsUpdatingPagePermission(false);
      popupState.close();
    }
  }

  async function updateSpaceDefaultPublicPages() {
    if (space && defaultPublicPages !== space?.defaultPublicPages) {
      const updatedSpace = await charmClient.setDefaultPublicPages({
        defaultPublicPages,
        spaceId: space.id
      });

      setSpace(updatedSpace);
    }
  }

  async function updateSpaceRequireProposalTemplate() {
    if (space && requireProposalTemplate !== space?.requireProposalTemplate) {
      const updatedSpace = await charmClient.setRequireProposalTemplate({
        requireProposalTemplate,
        spaceId: space.id
      });

      setSpace(updatedSpace);
    }
  }

  function updateSpaceDefaults() {
    updateSpaceDefaultPagePermission();
    updateSpaceDefaultPublicPages();
    updateSpaceRequireProposalTemplate();
    setTouched(false);
  }

  usePreventReload(touched);

  if (!space) {
    return null;
  }

  return (
    <>
      <Box mb={2}>
        <Typography fontWeight='bold'>Default permissions for new pages</Typography>
        <Typography variant='caption'>
          This applies to top-level pages only. Subpages will inherit permissions from their parent.
        </Typography>
      </Box>
      <Box mb={2} display='flex' alignItems='center' justifyContent='space-between'>
        <Typography>Default access level for Members</Typography>
        <Button
          color='secondary'
          variant='outlined'
          disabled={isUpdatingPagePermission || !isAdmin}
          loading={isUpdatingPagePermission}
          endIcon={!isUpdatingPagePermission && <KeyboardArrowDownIcon fontSize='small' />}
          {...bindTrigger(popupState)}
        >
          {pagePermissionLevels[selectedPagePermission]}
        </Button>
      </Box>
      <FormControlLabel
        sx={{
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between'
        }}
        control={
          <Switch
            disabled={!isAdmin}
            onChange={(ev) => {
              const { checked: publiclyAccessible } = ev.target;
              setDefaultPublicPages(publiclyAccessible);
              setTouched(true);
            }}
            defaultChecked={defaultPublicPages}
          />
        }
        label='Accessible to public'
        labelPlacement='start'
      />
      <FormControlLabel
        sx={{
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between'
        }}
        control={
          <Switch
            disabled={!isAdmin}
            onChange={(ev) => {
              setRequireProposalTemplate(ev.target.checked);
              setTouched(true);
            }}
            defaultChecked={requireProposalTemplate}
          />
        }
        label='Require proposal template'
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
          const permissionLevelLabel = pagePermissionLevels[permissionLevel];
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
    </>
  );
}

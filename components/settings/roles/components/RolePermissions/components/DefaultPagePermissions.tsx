import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Divider, FormControlLabel, Grid, Switch, Typography, Menu, MenuItem } from '@mui/material';
import type { PagePermissionLevel } from '@prisma/client';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { permissionLevels } from 'lib/permissions/pages/page-permission-mapping';
import { typedKeys } from 'lib/utilities/objects';

type PagePermissionLevelWithoutCustomAndProposalEditor = Exclude<PagePermissionLevel, 'custom' | 'proposal_editor'>;
const pagePermissionDescriptions: Record<PagePermissionLevelWithoutCustomAndProposalEditor, string> = {
  full_access: 'Space members can edit pages, share them with the public and manage permissions.',
  editor: 'Space members can edit but not share pages.',
  view_comment: 'Space members can view and comment on pages.',
  view: 'Space members can only view pages.'
};

export default function DefaultSpacePagePermissions() {
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

  const settingsChanged =
    space?.defaultPublicPages !== defaultPublicPages || selectedPagePermission !== space?.defaultPagePermissionGroup;

  async function updateSpaceDefaultPagePermission() {
    if (space && selectedPagePermission !== space?.defaultPagePermissionGroup) {
      setIsUpdatingPagePermission(true);
      const updatedSpace = await charmClient.setDefaultPagePermission({
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
    <Grid container direction='column' gap={2}>
      <Grid item container xs>
        <Grid item xs={12} md={8}>
          <Divider sx={{ mb: 2, mt: 0 }} />
          <Typography variant='body2' fontWeight='bold'>
            New page permissions
          </Typography>
          <Typography variant='caption'>
            These apply only to new top-level pages. You can still control access to each page individually.
          </Typography>
          <Box display='flex' alignItems='center' justifyContent='space-between' mt={2}>
            <Typography>Default access to Members</Typography>
            <Button
              color='secondary'
              variant='outlined'
              disabled={isUpdatingPagePermission || !isAdmin}
              loading={isUpdatingPagePermission}
              endIcon={!isUpdatingPagePermission && <KeyboardArrowDownIcon fontSize='small' />}
              {...bindTrigger(popupState)}
            >
              {permissionLevels[selectedPagePermission]}
            </Button>
          </Box>
          <Menu
            {...bindMenu(popupState)}
            PaperProps={{
              sx: { width: 300 }
            }}
          >
            {typedKeys(pagePermissionDescriptions).map((permissionLevel) => {
              const permissionLevelLabel = permissionLevels[permissionLevel];
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
        </Grid>
      </Grid>

      <Grid container item xs>
        <Grid item xs={12} md={8}>
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
          <Divider sx={{ my: 2 }} />
        </Grid>
      </Grid>

      {isAdmin && (
        <Grid item xs>
          <Button
            onClick={() => updateSpaceDefaults()}
            disabled={!settingsChanged || isUpdatingPagePermission}
            type='submit'
            variant='contained'
            color='primary'
            size='small'
          >
            Save
          </Button>
        </Grid>
      )}
    </Grid>
  );
}

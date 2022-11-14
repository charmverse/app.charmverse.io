import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Menu, MenuItem } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import type { PagePermissionLevelWithoutCustom } from 'lib/permissions/pages/page-permission-interfaces';
import { permissionLevels } from 'lib/permissions/pages/page-permission-mapping';

const pagePermissionDescriptions: Record<PagePermissionLevelWithoutCustom, string> = {
  full_access: 'Workspace members can edit pages, share them with the public and manage permissions.',
  proposal_editor: 'Proposal editors can edit proposals and share them with the public.',
  editor: 'Workspace members can edit but not share pages.',
  view_comment: 'Workspace members can view and comment on pages.',
  view: 'Workspace members can only view pages.'
};

export default function DefaultSpacePagePermissions () {

  const space = useCurrentSpace();
  const { setSpace } = useSpaces();

  const [isUpdatingPagePermission, setIsUpdatingPagePermission] = useState(false);

  const isAdmin = useIsAdmin();
  const [touched, setTouched] = useState<boolean>(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'workspace-default-page-permission' });

  // Permission states
  const [selectedPagePermission, setSelectedPagePermission] = useState<PagePermissionLevelWithoutCustom>(space?.defaultPagePermissionGroup as PagePermissionLevelWithoutCustom ?? 'full_access');
  const [defaultPublicPages, setDefaultPublicPages] = useState<boolean>(space?.defaultPublicPages ?? false);

  const settingsChanged = space?.defaultPublicPages !== defaultPublicPages || selectedPagePermission !== space?.defaultPagePermissionGroup;

  async function updateSpaceDefaultPagePermission () {
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

  async function updateSpaceDefaultPublicPages () {
    if (space && defaultPublicPages !== space?.defaultPublicPages) {
      const updatedSpace = await charmClient.setDefaultPublicPages({
        defaultPublicPages,
        spaceId: space.id
      });

      setSpace(updatedSpace);
    }
  }

  function updateSpaceDefaults () {
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
      <Grid item xs>
        <Typography variant='body2' fontWeight='bold'>
          Default page permissions
        </Typography>
        <Typography variant='caption'>
          These apply only to new top-level pages. You can still control access to each page individually.
        </Typography>
      </Grid>
      <Grid item container xs>
        <Grid item xs={6}>
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
          <Menu
            {...bindMenu(popupState)}
            PaperProps={{
              sx: { width: 300 }
            }}
          >
            {
            (Object.keys(pagePermissionDescriptions) as PagePermissionLevelWithoutCustom[]).map(permissionLevel => {

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
                  <StyledListItemText
                    primary={permissionLevelLabel}
                    secondary={description}
                  />
                </MenuItem>
              );
            })
          }

          </Menu>
        </Grid>
        <Grid item xs={6}>
          <Typography variant='body2' sx={{ height: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
            {pagePermissionDescriptions[selectedPagePermission]}
          </Typography>
        </Grid>
      </Grid>

      <Grid container item xs>
        <Grid item xs={6}>
          <FormControlLabel
            control={(
              <Switch
                disabled={!isAdmin}
                onChange={(ev) => {
                  const { checked: publiclyAccessible } = ev.target;
                  setDefaultPublicPages(publiclyAccessible);
                  setTouched(true);
                }}
                defaultChecked={defaultPublicPages}
              />
            )}
            label='Accessible to public'
          />
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ height: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column' }} variant='body2'>
            {
            defaultPublicPages === true && ('New top-level pages will be viewable by the public.')
          }
            {
            defaultPublicPages === false && ('New top-level pages can only be seen by workspace members.')
          }
          </Typography>
        </Grid>

      </Grid>

      {
        isAdmin && (
          <Grid item xs>
            <Button onClick={() => updateSpaceDefaults()} disabled={!settingsChanged || isUpdatingPagePermission} type='submit' variant='contained' color='primary' sx={{ mr: 1 }}>Save</Button>
          </Grid>
        )
      }

    </Grid>

  );
}

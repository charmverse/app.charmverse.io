import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Menu, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { SpacePermissionConfigurationMode } from '@prisma/client';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { configurationModeDescription, configurationModeName, getTemplateExplanation } from 'lib/permissions/meta/preset-templates';

interface Props {
  permissionModeSelected?: (mode: SpacePermissionConfigurationMode) => void;
}

export default function PermissionConfigurationMode ({ permissionModeSelected = () => null }: Props) {
  const space = useCurrentSpace();
  const { setSpace } = useSpaces();

  const isAdmin = useIsAdmin();

  const [selectedConfigurationMode, setSelectedConfigurationMode] = useState<SpacePermissionConfigurationMode>(space?.permissionConfigurationMode ?? 'custom');

  const [isUpdatingPermissionMode, setIsUpdatingPermissionMode] = useState(false);
  const [touched, setTouched] = useState<boolean>(false);

  const popupState = usePopupState({ variant: 'popover', popupId: 'workspace-permission-mode' });

  async function updateSettings () {

    if (space) {
      setIsUpdatingPermissionMode(true);
      const updatedSpace = await charmClient.setSpacePermissionMode({
        spaceId: space.id,
        permissionConfigurationMode: selectedConfigurationMode
      });

      setSpace(updatedSpace);
      setIsUpdatingPermissionMode(false);
      setTouched(false);
    }
  }

  usePreventReload(touched);

  if (!space) {
    return null;
  }

  const settingsChanged = space.permissionConfigurationMode !== selectedConfigurationMode;

  const templateExplanation = getTemplateExplanation(selectedConfigurationMode);

  const firstGridSmallColumnWidth = templateExplanation[1].length === 0 ? 12 : 6;
  const secondGridSmallColumnWidth = templateExplanation[0].length === 0 ? 12 : 6;

  return (
    <Grid container direction='column' gap={2}>
      <Grid item xs>
        <Typography variant='body2' fontWeight='bold'>
          Configuration mode
        </Typography>
        <Typography variant='caption'>
          Use a preset workspace permissions mode, or choose "custom" to configure individual settings manually.
        </Typography>
      </Grid>

      <Grid item container xs>
        <Grid item xs={12} sm={6}>
          <Button
            color='secondary'
            variant='outlined'
            disabled={isUpdatingPermissionMode || !isAdmin}
            loading={isUpdatingPermissionMode}
            endIcon={!isUpdatingPermissionMode && <KeyboardArrowDownIcon fontSize='small' />}
            {...bindTrigger(popupState)}
          >
            {configurationModeName[selectedConfigurationMode]}
          </Button>
          <Menu
            {...bindMenu(popupState)}
            PaperProps={{
              sx: { width: 300 }
            }}
          >
            {
            (Object.keys(SpacePermissionConfigurationMode) as SpacePermissionConfigurationMode[]).map(mode => {

              const label = configurationModeName[mode];
              const isSelected = selectedConfigurationMode === mode;
              const description = configurationModeDescription[mode];

              return (
                <MenuItem
                  key={mode}
                  selected={isSelected}
                  onClick={() => {
                    setSelectedConfigurationMode(mode);
                    permissionModeSelected(mode);
                    popupState.close();
                    setTouched(true);
                  }}
                >
                  <StyledListItemText
                    primary={label}
                    secondary={description}
                  />
                </MenuItem>
              );
            })
          }

          </Menu>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography
            variant='body2'
            sx={{ height: '100%',
              justifyContent: 'center',
              display: 'flex',
              flexDirection: 'column',
              margin: {
                xs: '10px 0',
                sm: 0
              } }}
          >
            {configurationModeDescription[selectedConfigurationMode]}
          </Typography>
        </Grid>
      </Grid>
      {
        selectedConfigurationMode !== 'custom' && (
          <Grid container item xs>
            <Grid item sm={firstGridSmallColumnWidth} xs={12} sx={{ pr: 2 }}>

              {
              templateExplanation[0].map(canDo => (
                <Grid key={canDo} item xs={12} display='flex'>
                  <DoneIcon color='success' sx={{ fontSize: '18px', mr: 0.5 }} />
                  <Typography variant='caption'>{canDo}</Typography>
                </Grid>
              ))
            }

            </Grid>
            <Grid container item sm={secondGridSmallColumnWidth} xs={12} sx={{ pr: 2 }}>
              {
              templateExplanation[1].map(cannotDo => (
                <Grid key={cannotDo} item xs={12} display='flex'>
                  <CloseIcon color='error' sx={{ fontSize: '18px', mr: 0.5 }} />
                  <Typography variant='caption'>{cannotDo}</Typography>
                </Grid>
              ))
            }
            </Grid>
          </Grid>
        )
      }

      {
        isAdmin && (
          <Grid item xs>
            <Button onClick={() => updateSettings()} disabled={!settingsChanged} type='submit' variant='contained' color='primary' sx={{ mr: 1 }}>Save</Button>
          </Grid>
        )
      }
    </Grid>
  );
}

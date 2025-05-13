import { Box, FormControlLabel, Switch } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useSpaces } from 'hooks/useSpaces';

export function RequireTemplatesForm() {
  const { space } = useCurrentSpace();
  const { setSpace } = useSpaces();
  const { getFeatureTitle } = useSpaceFeatures();
  const { isFreeSpace } = useIsFreeSpace();
  const rolesInfoPopup = usePopupState({ variant: 'popover', popupId: 'role-info-popup' });
  const [isUpdatingPagePermission, setIsUpdatingPagePermission] = useState(false);

  const isAdmin = useIsAdmin();
  const [touched, setTouched] = useState<boolean>(false);

  const { showMessage } = useSnackbar();
  const [requireProposalTemplate, setRequireProposalTemplate] = useState<boolean>(
    space?.requireProposalTemplate ?? false
  );

  const settingsChanged = space?.requireProposalTemplate !== requireProposalTemplate;
  async function updateSpaceRequireProposalTemplate() {
    if (space && requireProposalTemplate !== space?.requireProposalTemplate) {
      const updatedSpace = await charmClient.spaces.setRequireProposalTemplate({
        requireProposalTemplate,
        spaceId: space.id
      });

      setSpace(updatedSpace);
    }
  }

  async function saveForm() {
    try {
      setIsUpdatingPagePermission(true);
      await updateSpaceRequireProposalTemplate();
      setTouched(false);
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    setIsUpdatingPagePermission(false);
  }

  usePreventReload(touched);

  if (!space) {
    return null;
  }

  return (
    <>
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
                  setRequireProposalTemplate(ev.target.checked);
                  setTouched(true);
                }}
                defaultChecked={requireProposalTemplate && !isFreeSpace}
              />
            </Box>
          </UpgradeWrapper>
        }
        label={`Require a template when creating a ${getFeatureTitle('proposal')}`}
        labelPlacement='start'
      />
      <Box display='flex' justifyContent='flex-end'>
        <Button
          onClick={() => saveForm()}
          disabled={!isAdmin || !settingsChanged || isUpdatingPagePermission}
          type='submit'
          variant='contained'
          color='primary'
          size='small'
          sx={{ mt: 2 }}
        >
          Save
        </Button>
      </Box>
    </>
  );
}

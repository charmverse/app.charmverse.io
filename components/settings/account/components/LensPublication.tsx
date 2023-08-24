import { Box, CircularProgress, InputLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useLensProfile } from '../hooks/useLensProfile';

export function LensPublication() {
  const { user, updateUser } = useUser();
  const { setupLensProfile, lensProfile } = useLensProfile();
  const { showMessage } = useSnackbar();
  const [isSwitchOn, setIsSwitchOn] = useState(user?.publishToLensDefault ?? false);
  const [isSettingUpLensProfile, setIsSettingUpLensProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setIsSwitchOn(user.publishToLensDefault ?? false);
    }
  }, [user]);

  async function setAutoLensPublish() {
    if (!user) {
      return;
    }
    const newState = !isSwitchOn;
    setIsSettingUpLensProfile(true);
    let _lensProfile = lensProfile;
    if (!_lensProfile && !isSwitchOn) {
      try {
        _lensProfile = await setupLensProfile();
        if (_lensProfile) {
          showMessage('Lens profile setup successfully', 'success');
        } else {
          showMessage("You don't have a lens profile. Please setup one first.", 'warning');
        }
      } catch (err) {
        showMessage('Failed to set up Lens profile', 'error');
        // User rejected to sign the message
        return;
      } finally {
        setIsSettingUpLensProfile(false);
      }
    }
    // Only continue if the user has a lens profile or if the switch is turned on
    if (isSwitchOn || _lensProfile) {
      setIsSwitchOn(newState);
      await charmClient.updateUser({
        publishToLensDefault: newState
      });
      updateUser({ ...user, publishToLensDefault: newState });
    }
    setIsSettingUpLensProfile(false);
  }

  return (
    <Stack mt={2}>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Box component='span' display='flex' alignItems='center' gap={1}>
          Lens Protocol Integration
        </Box>
      </Legend>
      <Stack gap={2}>
        <InputLabel>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Switch size='small' disabled={isSettingUpLensProfile} checked={isSwitchOn} onChange={setAutoLensPublish} />
            Publish to Lens
            {isSettingUpLensProfile && <CircularProgress sx={{ ml: 1 }} color='secondary' size={16} />}
          </Stack>
          <Typography variant='caption'>
            Publish your proposals and proposal comments to Lens. A{' '}
            <Link href='https://www.lens.xyz/' external>
              Lens profile
            </Link>{' '}
            is required.
          </Typography>
        </InputLabel>
      </Stack>
      {lensProfile && (
        <Typography variant='caption' my={0.5}>
          Signed in as {lensProfile.handle}
        </Typography>
      )}
    </Stack>
  );
}

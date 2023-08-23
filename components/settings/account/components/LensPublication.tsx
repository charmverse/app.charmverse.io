import { Box, CircularProgress, InputLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Legend from 'components/settings/Legend';
import { useLensProfile } from 'components/settings/LensProfileProvider';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

export function LensPublication() {
  const { user, updateUser } = useUser();
  const { setupLensProfile, lensProfile } = useLensProfile();
  const { showMessage } = useSnackbar();
  const [isSwitchOn, setIsSwitchOn] = useState(user?.autoLensPublish ?? false);
  const [isSettingUpLensProfile, setIsSettingUpLensProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setIsSwitchOn(user.autoLensPublish ?? false);
    }
  }, [user]);

  async function setAutoLensPublish() {
    if (!user) {
      return;
    }
    setIsSettingUpLensProfile(true);
    let _lensProfile = lensProfile;
    if (!_lensProfile) {
      try {
        _lensProfile = await setupLensProfile();
        showMessage('Lens profile setup successfully', 'success');
      } catch (err) {
        showMessage('Failed to setup Lens profile', 'error');
        // User rejected to sign the message
        return;
      } finally {
        setIsSettingUpLensProfile(false);
      }
    }
    // Only continue if the user has a lens profile
    if (_lensProfile) {
      const newState = !isSwitchOn;
      setIsSwitchOn(newState);
      await charmClient.updateUser({
        autoLensPublish: newState
      });
      updateUser({ ...user, autoLensPublish: newState });
    }
    setIsSettingUpLensProfile(false);
  }

  return (
    <Stack mt={2}>
      <Legend
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        marginTop={(theme) => theme.spacing(4)}
        id='multisig-section'
      >
        <Box component='span' display='flex' alignItems='center' gap={1}>
          Publish
        </Box>
      </Legend>
      <Stack gap={2}>
        <InputLabel>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <div>
              <Switch
                size='small'
                disabled={isSettingUpLensProfile}
                checked={isSwitchOn}
                onChange={setAutoLensPublish}
              />
            </div>
            Lens Publication
            {isSettingUpLensProfile && <CircularProgress sx={{ ml: 1 }} color='secondary' size={16} />}
          </Stack>
          <Typography variant='caption'>
            Automatically publish Proposal and associated comments to Lens. You must have a Lens profile.
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

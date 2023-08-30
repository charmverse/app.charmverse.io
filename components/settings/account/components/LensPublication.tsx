import { Box, InputLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

import { useLensProfile } from '../hooks/useLensProfile';

export function LensPublication() {
  const { user, updateUser } = useUser();
  const { lensProfile, isAuthenticated } = useLensProfile();
  const [isSwitchOn, setIsSwitchOn] = useState(user?.publishToLensDefault ?? false);
  const [isSettingUpLensProfile, setIsSettingUpLensProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setIsSwitchOn(user.publishToLensDefault ?? false);
    }
  }, [user]);

  async function setAutoLensPublish() {
    const newState = !isSwitchOn;
    setIsSettingUpLensProfile(true);
    setIsSwitchOn(newState);
    await charmClient.updateUser({
      publishToLensDefault: newState
    });
    updateUser({ ...user, publishToLensDefault: newState });
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
      {lensProfile && isAuthenticated && (
        <Typography variant='caption' my={0.5}>
          Signed in as {lensProfile.handle}
        </Typography>
      )}
    </Stack>
  );
}

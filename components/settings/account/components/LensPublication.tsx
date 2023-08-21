import { Box, CircularProgress, InputLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

export function LensPublication() {
  const { user, updateUser } = useUser();
  const { data: lensProfile, isLoading: isLoadingLensProfile } = useSWR(
    user ? `public/profile/${user.id}/lens` : null,
    () => charmClient.publicProfile.getLensProfile(user!.id)
  );

  const [isSwitchOn, setIsSwitchOn] = useState(user?.autoLensPublish ?? false);

  async function setAutoLensPublish() {
    if (user) {
      const newState = !isSwitchOn;
      setIsSwitchOn(newState);
      await charmClient.updateUser({
        autoLensPublish: newState
      });
      updateUser({ ...user, autoLensPublish: newState });
    }
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
          {isLoadingLensProfile && <CircularProgress size={16} sx={{ ml: 1 }} color='secondary' />}
        </Box>
      </Legend>
      <Stack gap={2}>
        <InputLabel>
          <Stack flexDirection='row' alignItems='center' gap={1} width='fit-content' onClick={setAutoLensPublish}>
            <Tooltip title={!lensProfile && !isLoadingLensProfile ? "You don't have any Lens profile" : ''}>
              <div>
                <Switch size='small' disabled={isLoadingLensProfile || !lensProfile} checked={isSwitchOn} />
              </div>
            </Tooltip>
            Lens Publication
          </Stack>
          <Typography variant='caption'>Automatically publish Proposal and associated comments to Lens</Typography>
        </InputLabel>
      </Stack>
    </Stack>
  );
}

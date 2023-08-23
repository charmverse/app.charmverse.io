import { Box, InputLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/Legend';
import { useLensProfile } from 'components/settings/LensProfileProvider';
import { useUser } from 'hooks/useUser';

export function LensPublication() {
  const { user, updateUser } = useUser();
  const { setupLensProfile, lensProfile } = useLensProfile();

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
        </Box>
      </Legend>
      <Stack gap={2}>
        <InputLabel>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Tooltip title={!lensProfile ? "You don't have any Lens profile" : ''}>
              <div>
                <Switch size='small' disabled={!lensProfile} checked={isSwitchOn} onChange={setAutoLensPublish} />
              </div>
            </Tooltip>
            Lens Publication
          </Stack>
          <Typography variant='caption'>Automatically publish Proposal and associated comments to Lens</Typography>
        </InputLabel>
      </Stack>
      {lensProfile ? (
        <Typography variant='caption' my={0.5}>
          Signed in as {lensProfile.handle}
        </Typography>
      ) : (
        <Button
          onClick={setupLensProfile}
          size='small'
          sx={{
            my: 1,
            width: 'fit-content'
          }}
          startIcon={<img src='/images/logos/lens_logo.png' alt='Lens' width={16} height={16} />}
        >
          Login
        </Button>
      )}
    </Stack>
  );
}

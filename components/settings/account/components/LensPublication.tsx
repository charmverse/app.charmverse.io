import { InputLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

export function LensPublication() {
  const { user } = useUser();
  const { data: lensProfile, isLoading: isLoadingLensProfile } = useSWR(
    user ? `public/profile/${user.id}/lens` : null,
    () => charmClient.publicProfile.getLensProfile(user!.id)
  );

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  return (
    <Stack mt={2}>
      <Legend>Publish</Legend>
      <Stack gap={2}>
        <InputLabel>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Tooltip title={!lensProfile ? "You don't have any Lens profile" : ''}>
              <div>
                <Switch
                  size='small'
                  disabled={isLoadingLensProfile || !lensProfile}
                  checked={isSwitchOn}
                  onChange={() => setIsSwitchOn(!isSwitchOn)}
                />
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

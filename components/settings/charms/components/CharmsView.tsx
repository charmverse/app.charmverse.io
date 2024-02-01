import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { useUserCharms } from 'charmClient/hooks/charms';
import LoadingComponent from 'components/common/LoadingComponent';
import { ApplyCharmsTab } from 'components/settings/charms/components/ApplyCharmsTab';
import { CharmsHistoryTab } from 'components/settings/charms/components/CharmsHistoryTab';
import { useUser } from 'hooks/useUser';

export function CharmsView() {
  const { user } = useUser();
  const { data: charmWallet, mutate: refreshCharmWallet } = useUserCharms(user?.id);
  const dataLoaded = charmWallet !== undefined;

  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Stack>
      {dataLoaded ? (
        <Typography variant='h5'>You have {charmWallet?.balance || 0} Charms</Typography>
      ) : (
        <Stack my={1}>
          <LoadingComponent isLoading size={30} />
        </Stack>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} mt={2}>
        <Tabs value={value} onChange={handleChange} aria-label='basic tabs example'>
          <Tab label='Apply charms' {...a11yProps(0)} />
          <Tab label='History' {...a11yProps(1)} />
        </Tabs>
      </Box>

      <div role='tabpanel' hidden={value !== 0}>
        {value === 0 && (
          <Box py={2}>
            <ApplyCharmsTab charmWallet={charmWallet} onRefresh={refreshCharmWallet} />
          </Box>
        )}
      </div>
      <div role='tabpanel' hidden={value !== 1}>
        {value === 1 && (
          <Box py={2}>
            <CharmsHistoryTab />
          </Box>
        )}
      </div>
    </Stack>
  );
}

function a11yProps(index: number) {
  return {
    id: `charms-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import type { SyntheticEvent } from 'react';
import { useMemo, useState } from 'react';

import { useUserCharms } from 'charmClient/hooks/charms';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { ApplyCharmsTab } from 'components/settings/charms/components/ApplyCharmsTab';
import { CharmsHistoryTab } from 'components/settings/charms/components/CharmsHistoryTab';
import { useUser } from 'hooks/useUser';

export function CharmsView() {
  const { user } = useUser();
  const { data: charmWallet, mutate: refreshCharmWallet, isLoading } = useUserCharms(user?.id);

  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabConfig[] = useMemo(() => {
    return [
      [
        'Apply Charms',
        <ApplyCharmsTab key='apply' charmWallet={charmWallet} onRefresh={refreshCharmWallet} />,
        { sx: { px: 0 } }
      ],
      ['History', <CharmsHistoryTab key='history' />, { sx: { px: 0 } }]
    ];
  }, [charmWallet, refreshCharmWallet]);

  return (
    <Stack>
      {isLoading ? (
        <Stack my={1}>
          <LoadingComponent isLoading size={30} />
        </Stack>
      ) : (
        <Typography variant='h5'>You have {charmWallet?.balance || 0} Charms</Typography>
      )}

      <Stack mt={1}>
        <MultiTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      </Stack>
    </Stack>
  );
}

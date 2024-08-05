import { AccessAlarm, HourglassEmpty } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { useUserCharms } from 'charmClient/hooks/charms';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { ApplyCharmsTab } from 'components/settings/charms/components/ApplyCharmsTab';
import { CharmsHistoryTab } from 'components/settings/charms/components/CharmsHistoryTab';
import { LeaderBoardTab } from 'components/settings/charms/components/LeaderBoardTab';
import { ReferralCodeButton } from 'components/settings/referrals/ReferralCodeButton';
import { useUser } from 'hooks/useUser';

export function CharmsView() {
  const { user } = useUser();
  const { data: charmWallet, mutate: refreshCharmWallet, isLoading } = useUserCharms(user?.id);

  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabConfig[] = useMemo(() => {
    return [
      ['History', <CharmsHistoryTab key='history' />, { sx: { px: 0 } }],
      ['Leaders', <LeaderBoardTab key='leaders' charmWallet={charmWallet} />, { sx: { px: 0 } }],
      [
        'Apply',
        <ApplyCharmsTab key='apply' charmWallet={charmWallet} onRefresh={refreshCharmWallet} />,
        { sx: { px: 0 } }
      ]
    ];
  }, [charmWallet, refreshCharmWallet]);

  return (
    <Stack>
      <Stack>
        {isLoading ? (
          <Stack my={1}>
            <LoadingComponent isLoading size={25} />
          </Stack>
        ) : (
          <Typography variant='h5'>You have {charmWallet?.balance || 0} Charms</Typography>
        )}

        <ReferralCodeButton />
      </Stack>

      <Stack mt={1}>
        <MultiTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      </Stack>
    </Stack>
  );
}

function ComingSoon() {
  return (
    <Stack direction='row' flex={1} justifyContent='center' alignItems='center' gap={1}>
      <HourglassEmpty color='secondary' fontSize='large' />
      <Typography variant='h5' color='secondary'>
        Coming soon...
      </Typography>
    </Stack>
  );
}

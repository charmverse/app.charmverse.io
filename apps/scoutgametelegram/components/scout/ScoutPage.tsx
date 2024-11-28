import { Box, Typography } from '@mui/material';
import { LoadingTable } from '@packages/scoutgame-ui/components/claim/components/common/LoadingTable';
import {
  scoutTabs,
  ScoutTabsMenu
} from '@packages/scoutgame-ui/components/scout/ScoutPageTable/components/ScoutTabsMenu';
import { ScoutPageTable } from '@packages/scoutgame-ui/components/scout/ScoutPageTable/ScoutPageTable';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/scout/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { InfoModal } from './InfoModal';

const HeaderMessage = dynamic(
  () => import('@packages/scoutgame-ui/components/common/Header/HeaderMessage').then((mode) => mode.HeaderMessage),
  {
    ssr: false
  }
);

export function ScoutPage({ tab, order, sort }: { tab: string; order: string; sort: string }) {
  const currentTab = scoutTabs.some((t) => t.value === tab) ? tab : 'builders';

  return (
    <>
      <HeaderMessage />
      <Typography variant='h4' color='secondary' textAlign='center' fontWeight='bold' my={2}>
        Scout today's HOT Builders!
      </Typography>
      <TodaysHotBuildersCarousel />
      <Box
        sx={{
          position: 'sticky',
          top: -2.5,
          backgroundColor: 'background.default',
          zIndex: 1
        }}
      >
        <ScoutTabsMenu tab={currentTab} />
        <InfoModal builder={currentTab === 'builders'} />
      </Box>
      <Suspense key={currentTab} fallback={<LoadingTable />}>
        <ScoutPageTable tab={currentTab} order={order} sort={sort} />
      </Suspense>
    </>
  );
}

import { Box, Typography } from '@mui/material';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { InfoModal } from '@packages/scoutgame-ui/components/scout/InfoModal';
import {
  scoutTabs,
  ScoutTabsMenu
} from '@packages/scoutgame-ui/components/scout/ScoutPageTable/components/ScoutTabsMenu';
import { ScoutPageTable } from '@packages/scoutgame-ui/components/scout/ScoutPageTable/ScoutPageTable';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/scout/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const HeaderMessage = dynamic(
  () => import('@packages/scoutgame-ui/components/common/Header/HeaderMessage').then((mode) => mode.HeaderMessage),
  {
    ssr: false
  }
);

export function ScoutPage({
  tab,
  builderSort,
  scoutSort,
  scoutOrder,
  builderOrder
}: {
  tab: string;
  builderSort: string;
  scoutSort: string;
  scoutOrder: string;
  builderOrder: string;
}) {
  const currentTab = scoutTabs.some((t) => t.value === tab) ? tab : 'builders';

  return (
    <>
      <HeaderMessage />
      <Typography variant='h4' color='secondary' textAlign='center' fontWeight='bold' my={2}>
        Scout today's HOT Builders!
      </Typography>
      <Box
        sx={{
          height: 250
        }}
      >
        <TodaysHotBuildersCarousel />
      </Box>
      <Box
        sx={{
          position: 'sticky',
          top: -2.5,
          backgroundColor: 'background.default',
          zIndex: 1
        }}
      >
        <ScoutTabsMenu tab={currentTab} />
        <InfoModal builder={currentTab === 'builders'} sx={{ position: 'absolute', right: 10, top: 3.5 }} />
      </Box>
      <Suspense key={currentTab} fallback={<LoadingTable />}>
        <ScoutPageTable
          tab={currentTab}
          sort={currentTab === 'builders' ? builderSort : scoutSort}
          order={currentTab === 'builders' ? builderOrder : scoutOrder}
        />
      </Suspense>
    </>
  );
}

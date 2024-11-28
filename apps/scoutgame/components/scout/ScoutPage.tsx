import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { TabsMenu, type TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { ScoutPageTable } from '@packages/scoutgame-ui/components/scout/ScoutPageTable/ScoutPageTable';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/scout/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';

import { PageContainer } from 'components/layout/PageContainer';

import { SearchBuildersInput } from './components/SearchBuildersInput';

export const scoutTabOptions: TabItem[] = [
  { label: 'ALL Scouts', value: 'scouts' },
  { label: 'New Scouts', value: 'new-scouts' }
];

export function ScoutPage({
  scoutSort,
  builderSort,
  scoutOrder,
  builderOrder,
  scoutTab
}: {
  scoutSort: string;
  builderSort: string;
  scoutOrder: string;
  builderOrder: string;
  scoutTab: string;
}) {
  return (
    <>
      <HeaderMessage />
      <Grid container spacing={1} height='calc(100vh - 100px)'>
        <Grid
          size={7}
          sx={{
            height: '100%',
            overflowX: 'hidden',
            p: 2,
            gap: 2
          }}
        >
          <TodaysHotBuildersCarousel />
          <Stack position='sticky' top={0} zIndex={1} bgcolor='background.default' gap={2}>
            <Typography color='secondary' textAlign='center' variant='h5'>
              Browser ALL Builders
            </Typography>
            <SearchBuildersInput />
            <ScoutPageTable tab='builders' order={builderOrder} sort={builderSort} />
          </Stack>
        </Grid>
        <Grid size={5} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.default' }}>
            <TabsMenu value={scoutTab} tabs={scoutTabOptions} queryKey='scout-tab' />
          </Box>
          <ScoutPageTable tab={scoutTab} order={scoutOrder} sort={scoutSort} />
        </Grid>
      </Grid>
    </>
  );
}

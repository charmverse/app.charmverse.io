import AppsIcon from '@mui/icons-material/Apps';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { TabsMenu, type TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { InfoModal } from '@packages/scoutgame-ui/components/scout/InfoModal';
import { ScoutPageTable } from '@packages/scoutgame-ui/components/scout/ScoutPageTable/ScoutPageTable';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/scout/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import { isTruthy } from '@packages/utils/types';
import Link from 'next/link';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
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
  scoutTab,
  buildersLayout,
  tab
}: {
  scoutSort: string;
  builderSort: string;
  scoutOrder: string;
  builderOrder: string;
  scoutTab: string;
  buildersLayout: string;
  tab: string;
}) {
  const urlString = Object.entries({ tab, scoutSort, builderSort, scoutOrder, builderOrder })
    .filter(([, value]) => isTruthy(value))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

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
          <Stack position='sticky' top={0} zIndex={1} bgcolor='background.default'>
            <Typography color='secondary' textAlign='center' variant='h5'>
              Browser ALL Builders
            </Typography>
            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                position: 'sticky',
                top: -20,
                zIndex: 1,
                gap: 2,
                backgroundColor: 'background.default',
                alignItems: 'center',
                py: 2
              }}
            >
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Link href={`/scout?${urlString ? `${urlString}&` : ''}buildersLayout=table`}>
                  <FormatListBulletedIcon color={buildersLayout === 'table' ? 'secondary' : 'disabled'} />
                </Link>
                <Link href={`/scout?${urlString ? `${urlString}&` : ''}buildersLayout=gallery`}>
                  <AppsIcon color={buildersLayout === 'gallery' ? 'secondary' : 'disabled'} />
                </Link>
              </Stack>
              <SearchBuildersInput sx={{ maxWidth: '500px' }} />
              <InfoModal builder />
            </Stack>
            {buildersLayout === 'table' && <ScoutPageTable tab='builders' order={builderOrder} sort={builderSort} />}
            {buildersLayout === 'gallery' && <ScoutPageBuildersGallery showHotIcon />}
          </Stack>
        </Grid>
        <Grid size={5} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.default' }}>
            <TabsMenu value={scoutTab} tabs={scoutTabOptions} queryKey='scout-tab' />
            <InfoModal sx={{ position: 'absolute', right: 10, top: 3.5 }} />
          </Box>
          <ScoutPageTable tab={scoutTab} order={scoutOrder} sort={scoutSort} />
        </Grid>
      </Grid>
    </>
  );
}

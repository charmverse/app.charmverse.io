import AppsIcon from '@mui/icons-material/Apps';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { TabsMenu, type TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { InfoModal } from '@packages/scoutgame-ui/components/scout/InfoModal';
import { ScoutPageTable } from '@packages/scoutgame-ui/components/scout/ScoutPageTable/ScoutPageTable';
import { StarterPackCarousel } from '@packages/scoutgame-ui/components/scout/StarterPackCarousel/StarterPackCarousel';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/scout/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import { isTruthy } from '@packages/utils/types';
import Link from 'next/link';

import { ScoutPageBuildersGallery } from './components/ScoutPageBuildersGallery';
import { SearchBuildersInput } from './components/SearchBuildersInput';

export const scoutTabOptions: TabItem[] = [
  { label: 'All Scouts', value: 'scouts' },
  { label: 'New Scouts', value: 'new-scouts' }
];

export const scoutTabMobileOptions: TabItem[] = [
  { label: 'Builders', value: 'builders' },
  { label: 'All Scouts', value: 'scouts' },
  { label: 'New Scouts', value: 'new-scouts' }
];

export function ScoutPage({
  scoutSort,
  builderSort,
  scoutOrder,
  builderOrder,
  scoutTab,
  buildersLayout,
  tab,
  starterpackBuilders,
  remainingStarterCards,
  userId
}: {
  scoutSort: string;
  builderSort: string;
  scoutOrder: string;
  builderOrder: string;
  scoutTab: string;
  buildersLayout: string;
  tab: string;
  starterpackBuilders: StarterPackBuilder[];
  remainingStarterCards?: number;
  userId?: string;
}) {
  const urlString = Object.entries({ tab, scoutSort, builderSort, scoutOrder, builderOrder })
    .filter(([, value]) => isTruthy(value))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return (
    <>
      <HeaderMessage />
      <Grid
        container
        spacing={1}
        height={{
          md: 'calc(100vh - 100px)',
          xs: 'calc(100vh - 160px)'
        }}
        data-test='scout-page'
      >
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            height: '100%',
            overflowX: 'hidden',
            p: 2,
            gap: 2
          }}
        >
          {starterpackBuilders.length ? (
            <StarterPackCarousel builders={starterpackBuilders} remainingStarterCards={remainingStarterCards} />
          ) : (
            <>
              <Typography variant='h5' color='secondary' textAlign='center' fontWeight='bold' mb={2} mt={2}>
                Scout today's HOT Builders!
              </Typography>
              <Box
                sx={{
                  height: {
                    xs: 250,
                    md: 325
                  }
                }}
              >
                <TodaysHotBuildersCarousel showPromoCards />
              </Box>
            </>
          )}

          <Stack
            position='sticky'
            top={0}
            bgcolor='background.default'
            sx={{ display: { xs: 'none', md: 'flex' }, mt: 4 }}
          >
            <Typography color='secondary' textAlign='center' variant='h5'>
              Browse All Builders
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
                py: 2,
                display: { xs: 'none', md: 'flex' }
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
          <Stack position='sticky' top={0} bgcolor='background.default' sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Box sx={{ position: 'absolute', right: 0, top: 3.5, zIndex: 2 }}>
              <InfoModal builder={tab === 'builders'} />
            </Box>
            <TabsMenu
              value={tab}
              tabs={scoutTabMobileOptions}
              queryKey='tab'
              sx={{ position: 'sticky', top: -20, zIndex: 1, backgroundColor: 'background.default' }}
            />
            <ScoutPageTable
              tab={tab}
              order={tab === 'builders' ? builderOrder : scoutOrder}
              sort={tab === 'builders' ? builderSort : scoutSort}
            />
          </Stack>
        </Grid>
        <Grid
          size={4}
          sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', display: { xs: 'none', md: 'block' } }}
        >
          <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.default' }}>
            <TabsMenu value={scoutTab} tabs={scoutTabOptions} queryKey='scoutTab' />
            <InfoModal sx={{ position: 'absolute', right: 10, top: 3.5 }} />
          </Box>
          <ScoutPageTable tab={scoutTab} order={scoutOrder} sort={scoutSort} />
        </Grid>
      </Grid>
    </>
  );
}

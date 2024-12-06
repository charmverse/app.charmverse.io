import { Box, Paper, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';

import 'swiper/css';
import 'swiper/css/autoplay';
import { getEditorialDescription } from './editorial';
import { StarterPackInfo } from './StarterPackInfo';

export function StarterPackCarousel({
  builders,
  remainingStarterCards
}: {
  builders: BuilderInfo[];
  remainingStarterCards?: number;
}) {
  return (
    <Stack gap={2}>
      <StarterPackInfo remainingStarterCards={remainingStarterCards} />
      <Carousel
        slidesPerView={1}
        autoplay={false}
        boxProps={{ width: { xs: '100%', md: '90%' }, margin: '0 auto' }}
        navigation={{
          nextEl: '.swiper-starter-pack-button-next',
          prevEl: '.swiper-starter-pack-button-prev'
        }}
        mobileMinHeight='550px'
        showMobileNavigationArrows
      >
        {builders.map((builder) => (
          <Stack
            key={builder.id}
            flexDirection={{ xs: 'column', md: 'row' }}
            component={Paper}
            gap={2}
            p={{ xs: 2, md: 4 }}
          >
            <Box>
              <BuilderCard builder={builder} showPurchaseButton />
            </Box>
            <Box display='flex' alignItems='center' flexWrap='wrap'>
              {/* <Typography>{builder.bio}</Typography> */}
              <Typography width='fit-container'>
                {getEditorialDescription({ fid: builder.farcasterId as number }) ?? builder.bio}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Carousel>
    </Stack>
  );
}

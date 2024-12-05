import { Box, Paper, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from '../../../components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../../components/common/Carousel/Carousel';

import 'swiper/css';
import 'swiper/css/autoplay';
import { getEditorialDescription } from './editorial';

export function StarterPackCarousel({ builders }: { builders: BuilderInfo[] }) {
  return (
    <Stack gap={2}>
      <Typography variant='h5' color='secondary' fontWeight={600} textAlign='center'>
        Scout your Starter Pack
      </Typography>
      <Carousel slidesPerView={1} autoplay={false} boxProps={{ width: { xs: '100%', md: '80%' }, margin: '0 auto' }}>
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

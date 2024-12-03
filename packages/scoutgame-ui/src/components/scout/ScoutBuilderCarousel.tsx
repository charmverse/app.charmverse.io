import { Box, Paper, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from '../../components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../components/common/Carousel/Carousel';

import 'swiper/css';
import 'swiper/css/autoplay';

export function ScoutBuilderCarousel({ builders }: { builders: BuilderInfo[] }) {
  return (
    <Carousel slidesPerView={3} autoplay={false} boxProps={{ width: { md: '70svw' } }}>
      {builders.map((builder) => (
        <Stack key={builder.id} flexDirection={{ md: 'row' }} component={Paper} gap={2} p={{ xs: 2, md: 4 }}>
          <Box>
            <BuilderCard builder={builder} showPurchaseButton />
          </Box>
          <Box display='flex' alignItems='center'>
            <Typography>{builder.bio}</Typography>
          </Box>
        </Stack>
      ))}
    </Carousel>
  );
}

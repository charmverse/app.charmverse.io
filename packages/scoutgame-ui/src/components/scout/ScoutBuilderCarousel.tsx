import { Box, Paper, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from '../../components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../components/common/Carousel/Carousel';

import 'swiper/css';
import 'swiper/css/autoplay';

export function ScoutBuilderCarousel({ builders }: { builders: BuilderInfo[] }) {
  return (
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
              Piesrtasy is the co-founder of DeFi platform HAI and the lead developer at Reflexer Finance, the team
              behind the RAI stablecoin, which Vitalik has called an "ideal type of a collateralized automated
              stablecoin”
            </Typography>
          </Box>
        </Stack>
      ))}
    </Carousel>
  );
}

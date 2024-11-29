'use client';

import { Box } from '@mui/material';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';

const partnersLogo = ['talent.jpg', 'celo.png', 'op.png', 'game7.png', 'lit.png'];

export function PartnerRewardsCarousel() {
  const isDesktop = useMdScreen();

  return (
    <Box
      mb={0}
      sx={{
        '& img.swiper-pagination-bullet': {
          width: {
            xs: 20,
            md: 25
          },
          height: {
            xs: 20,
            md: 25
          },
          borderRadius: '50%',
          marginRight: {
            xs: '10px !important',
            md: '20px !important'
          },
          marginLeft: {
            xs: '10px !important',
            md: '20px !important'
          },
          zIndex: 100,
          position: 'relative',
          top: 10,
          opacity: 0.5
        },
        '& img.swiper-pagination-bullet-active': {
          opacity: 1
        }
      }}
    >
      <Carousel
        height={isDesktop ? 300 : 165}
        slidesPerView={1}
        renderBullet={(index, className) => `<img src="/images/crypto/${partnersLogo[index]}" class="${className}"/>`}
      >
        {['talent', 'celo', 'op-supersim', 'game7', 'lit'].map((partner) => (
          <Image
            src={`/images/promos/${partner}-promo-slide.png`}
            alt={partner}
            width={isDesktop ? 750 : 250}
            height={isDesktop ? 250 : 150}
            key={partner}
            style={{ objectFit: 'scale-down', width: '100%' }}
          />
        ))}
      </Carousel>
    </Box>
  );
}

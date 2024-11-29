'use client';

import { Box } from '@mui/material';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import Image from 'next/image';

const partnersLogo = ['talent.jpg', 'celo.png', 'op.png', 'game7.png', 'lit.png'];

export function PartnerRewardsCarousel() {
  return (
    <Box
      sx={{
        '& img.swiper-pagination-bullet': {
          width: 25,
          height: 25,
          borderRadius: '50%',
          marginRight: '20px !important',
          marginLeft: '20px !important',
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
        height={300}
        slidesPerView={1}
        renderBullet={(index, className) => `<img src="/images/crypto/${partnersLogo[index]}" class="${className}"/>`}
      >
        {['talent', 'celo', 'op-supersim', 'game7', 'lit'].map((partner) => (
          <Image
            src={`/images/promos/${partner}-promo-slide.png`}
            alt={partner}
            width={750}
            height={250}
            key={partner}
          />
        ))}
      </Carousel>
    </Box>
  );
}

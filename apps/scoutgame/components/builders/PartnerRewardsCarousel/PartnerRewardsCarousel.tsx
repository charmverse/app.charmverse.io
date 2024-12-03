'use client';

import { Box } from '@mui/material';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';
import Link from 'next/link';

const partnerInfos = [
  { logo: 'talent.jpg', name: 'talent', infoPath: 'talent-protocol' },
  { logo: 'celo.png', name: 'celo', infoPath: 'celo' },
  { logo: 'op.png', name: 'op-supersim', infoPath: 'op-supersim' },
  { logo: 'game7.png', name: 'game7', infoPath: 'game7' },
  { logo: 'lit.png', name: 'lit', infoPath: 'lit' }
];

export function PartnerRewardsCarousel() {
  const isDesktop = useMdScreen();

  return (
    <Box
      mb={0}
      sx={{
        '& img.swiper-pagination-bullet': {
          width: {
            xs: 17.5,
            md: 25
          },
          height: {
            xs: 17.5,
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
        height={isDesktop ? 300 : 145}
        slidesPerView={1}
        renderBullet={(index, className) =>
          `<img src="/images/crypto/${partnerInfos[index].logo}" class="${className}"/>`
        }
      >
        {partnerInfos.map((partner) => (
          <Link href={`/info/partner-rewards/${partner.infoPath}`} key={partner.name}>
            <Image
              src={`/images/promos/${partner.name}-promo-slide.png`}
              alt={partner.name}
              width={isDesktop ? 750 : 250}
              height={isDesktop ? 250 : 115}
              style={{ objectFit: 'contain', width: '100%' }}
            />
          </Link>
        ))}
      </Carousel>
    </Box>
  );
}

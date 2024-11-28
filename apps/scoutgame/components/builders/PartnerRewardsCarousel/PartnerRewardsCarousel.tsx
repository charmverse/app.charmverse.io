'use client';

import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import Image from 'next/image';

const partnersLogo = ['celo.png', 'game7.png', 'lit.png', 'op.png', 'talent.jpg'];

export function PartnerRewardsCarousel() {
  return (
    <Carousel
      height={300}
      slidesPerView={1}
      renderBullet={(index, className) =>
        `<img src="/images/crypto/${partnersLogo[index]}" style="position: relative; top: 0px; width: 25px; z-index: 100; height: 25px; border-radius: 50%; margin-right: 20px; margin-left: 20px; opacity: ${className === 'swiper-pagination-bullet-active' ? 1 : 0.5}" />`
      }
    >
      {['celo', 'game7', 'lit', 'op-supersim', 'talent'].map((partner) => (
        <Image src={`/images/promos/${partner}-promo-slide.png`} alt={partner} width={750} height={250} key={partner} />
      ))}
    </Carousel>
  );
}

'use client';

import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import Image from 'next/image';

export function PartnerRewardsCarousel() {
  return (
    <Carousel slidesPerView={1}>
      {['celo', 'game7', 'lit', 'op-supersim', 'talent'].map((partner) => (
        <Image src={`/images/promos/${partner}-promo-slide.png`} alt={partner} width={750} height={250} key={partner} />
      ))}
    </Carousel>
  );
}

import 'server-only';

import dynamic from 'next/dynamic';

import type { CarouselProps } from 'components/common/Carousel/Carousel';
import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';

import { BuilderCard } from '../Card/BuilderCard';

const Carousel = dynamic<CarouselProps>(
  () => import('components/common/Carousel/Carousel').then((mod) => mod.Carousel),
  {
    ssr: false
  }
);

export async function TodaysHotBuildersCarousel() {
  const builders = await getTodaysHotBuilders({ limit: 10 });

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard key={builder.id} builder={builder} showPurchaseButton />
      ))}
    </Carousel>
  );
}

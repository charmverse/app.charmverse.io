import 'server-only';

import { delay } from '@root/lib/utils/async';
import dynamic from 'next/dynamic';

import { userCards } from 'lib/users/mock/userCards';

const Carousel = dynamic(() => import('components/common/Carousel/Carousel').then((mod) => mod.Carousel), {
  ssr: false
});

export async function CarouselContainer() {
  await delay(3000);

  return <Carousel items={userCards} />;
}

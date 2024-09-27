import 'server-only';

import dynamic from 'next/dynamic';

import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';

const Carousel = dynamic(() => import('components/common/Carousel/Carousel').then((mod) => mod.Carousel), {
  ssr: false
});

export async function TodaysHotBuildersCarousel() {
  const builders = await getTodaysHotBuilders({ limit: 10 });

  const user = await getUserFromSession();

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard key={builder.id} builder={builder} showPurchaseButton user={user} showHotIcon />
      ))}
    </Carousel>
  );
}

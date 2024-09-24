import 'server-only';

import { pricingGetter } from '@root/lib/crypto-price/getters';
import dynamic from 'next/dynamic';

import { getSortedBuilders } from 'lib/builders/getSortedBuilders';
import { getUserFromSession } from 'lib/session/getUserFromSession';

const Carousel = dynamic(() => import('components/common/Carousel/Carousel').then((mod) => mod.Carousel), {
  ssr: false
});

export async function CarouselContainer() {
  const scout = await getUserFromSession();
  const price = await pricingGetter.getQuote('ETH', 'USD').catch(() => ({
    base: 'ETH',
    quote: 'USD',
    amount: 2544.5,
    receivedOn: 1726868673193
  }));

  const accounts = await getSortedBuilders({ limit: 10, sort: 'hot' }).then((accs) =>
    accs.map((a) => ({ ...a, price: Math.round((Number(a.price) / 18) * price!.amount) }))
  );

  return <Carousel items={accounts} scout={scout} />;
}

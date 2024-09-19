import { notFound } from 'next/navigation';

import { NFTPurchase } from 'components/nft/NFTPurchase';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // const currentUser = await getUserFromSession();
  // if (!currentUser) {
  //   return notFound();
  // }

  // return <h2>test</h2>;

  return <NFTPurchase builderId='b9b05f89-c82e-4025-8c21-1a3c98b21ecd' />;
}

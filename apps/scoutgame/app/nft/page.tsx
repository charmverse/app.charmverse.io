import { notFound } from 'next/navigation';

import { NFTPurchase } from 'components/nft/NFTPurchase';
import { getCurrentUserAction } from 'lib/user/getCurrentUserAction';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { username: string } }) {
  const actionResult = await getCurrentUserAction();
  const currentUser = actionResult?.data;
  if (!currentUser || !currentUser.wallets?.length) {
    return notFound();
  }

  return <NFTPurchase walletAddress={currentUser.wallets[0].address} />;
}

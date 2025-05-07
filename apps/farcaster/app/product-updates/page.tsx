import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import { getFarcasterUsers } from '@packages/lib/farcaster/getFarcasterUsers';
import type { Metadata } from 'next';

import { ProductUpdatesPage } from 'components/product-updates/ProductUpdatesPage';
import { decrypt } from 'lib/crypto';
import { getConnectProjectsByFid } from 'lib/projects/getConnectProjectsByFid';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Product Updates'
};

export default async function Home({
  searchParams
}: {
  searchParams: {
    fid?: string;
    token?: string;
  };
}) {
  const token = searchParams.token;
  const fidParam = process.env.REACT_APP_APP_ENV !== 'production' && searchParams.fid;

  const fidStr = token ? decrypt(token) : fidParam;
  if (!fidStr) {
    throw new Error('Missing user query');
  }
  const fid = parseInt(fidStr);

  const [farcasterUser] = await getFarcasterUsers({ fids: [fid] });

  if (!farcasterUser) {
    throw new Error('Invalid state');
  }

  const connectProjects = await getConnectProjectsByFid(fid);

  return (
    <PageWrapper>
      <ProductUpdatesPage farcasterUser={farcasterUser} connectProjects={connectProjects} />
    </PageWrapper>
  );
}

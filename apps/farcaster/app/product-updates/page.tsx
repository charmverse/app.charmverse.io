import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

import { ProductUpdatesComposerAction } from 'components/ProductUpdatesComposerAction';
import { decrypt } from 'lib/crypto';
import { getConnectProjectsByFid } from 'lib/getConnectProjectsByFid';

export default async function Home({
  searchParams
}: {
  searchParams: {
    token: string;
  };
}) {
  const token = searchParams.token || null;

  if (!token) {
    throw new Error('Invalid state');
  }

  const fid = parseInt(decrypt(token.toString()));

  const [farcasterUser] = await getFarcasterUsers({ fids: [fid] });

  if (!farcasterUser) {
    throw new Error('Invalid state');
  }

  const connectProjects = await getConnectProjectsByFid(fid);

  return (
    <PageWrapper>
      <ProductUpdatesComposerAction farcasterUser={farcasterUser} connectProjects={connectProjects} />
    </PageWrapper>
  );
}

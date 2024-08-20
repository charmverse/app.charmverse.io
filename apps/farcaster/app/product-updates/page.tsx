import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

import { ProductUpdatesComposerAction } from 'components/product-updates/ProductUpdatesComposerAction';
import { encrypt, decrypt } from 'lib/crypto';
import { getConnectProjectsByFid } from 'lib/projects/getConnectProjectsByFid';

export default async function Home({
  searchParams
}: {
  searchParams: {
    fid?: string;
    token?: string;
  };
}) {
  const token = searchParams.token;
  const fidParam = searchParams.fid;

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
      <ProductUpdatesComposerAction farcasterUser={farcasterUser} connectProjects={connectProjects} />
    </PageWrapper>
  );
}

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

import { decrypt } from 'lib/crypto';
import { getConnectProjectsByFid } from 'lib/getConnectProjectsByFid';

import { WeeklyUpdatesComposerAction } from '../components/WeeklyUpdatesComposerAction';

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
      <WeeklyUpdatesComposerAction farcasterUser={farcasterUser} connectProjects={connectProjects} />
    </PageWrapper>
  );
}

import { JoinWaitlistHome } from 'components/frame/JoinWaitlistHome';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage({ params }: { params: { fid: string } }) {
  return <JoinWaitlistHome referrerFid={params.fid} />;
}

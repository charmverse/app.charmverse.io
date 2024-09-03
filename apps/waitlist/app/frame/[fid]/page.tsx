import { JoinWaitlistHome } from 'components/frame/joinWaitlist/JoinWaitlistHome';

export default async function WaitlistPage({ params }: { params: { fid: string } }) {
  return <JoinWaitlistHome referrerFid={params.fid} />;
}

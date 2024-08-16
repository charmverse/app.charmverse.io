import { JoinWaitlistHome } from 'components/waitlist/joinWaitlist/JoinWaitlistHome';

export default async function WaitlistPage({ params }: { params: { fid: string } }) {
  return <JoinWaitlistHome referrerFid={params.fid} />;
}

import { JoinWaitlistHome } from 'components/frame/joinWaitlist/JoinWaitlistHome';

export default async function WaitlistPage({ params }: { params: { fid: string } }) {
  // const src = 'https://www.gettyimages.fr/gi-resources/images/Embed/new/embed1.jpg';

  return <JoinWaitlistHome referrerFid={params.fid} />;
}

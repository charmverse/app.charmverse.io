import { LevelUpWaitlistHome } from 'components/waitlist/LevelUpWaitlistHome';

export default async function LevelUpPage({ params }: { params: { fid: string } }) {
  return <LevelUpWaitlistHome />;
}

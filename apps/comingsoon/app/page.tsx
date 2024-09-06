import { ComingSoon } from 'components/home/ComingSoon';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  return <ComingSoon />;
}

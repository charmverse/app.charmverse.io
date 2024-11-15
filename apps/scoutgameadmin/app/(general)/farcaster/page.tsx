import { FarcasterDashboard } from 'components/farcaster/FarcasterDashboard';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getUserFromSession();
  return <FarcasterDashboard />;
}

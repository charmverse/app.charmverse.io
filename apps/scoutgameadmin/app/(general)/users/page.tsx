import { UsersDashboard } from 'components/users/UsersDashboard';
import { getUsers } from 'lib/users/getUsers';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const users = await getUsers();
  return <UsersDashboard users={users} />;
}

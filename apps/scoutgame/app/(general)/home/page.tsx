import { HomePage } from 'components/home/HomePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Home() {
  const user = await getUserFromSession();

  return <HomePage user={user || null} />;
}

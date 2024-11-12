import ScoutPage from 'components/scout/ScoutPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Scout() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  return <ScoutPage />;
}

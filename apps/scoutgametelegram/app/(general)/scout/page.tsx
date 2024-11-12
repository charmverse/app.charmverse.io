import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import ScoutPage from 'components/scout/ScoutPage';

export default async function Scout() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  return <ScoutPage />;
}

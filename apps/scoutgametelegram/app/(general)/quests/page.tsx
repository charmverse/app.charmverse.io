import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { QuestsPage } from 'components/quests/QuestsPage';
import { getDailyClaims } from 'lib/claims/getDailyClaims';
import { getQuests } from 'lib/quests/getQuests';

export default async function Quests() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const dailyClaims = await getDailyClaims(user.id);
  const quests = await getQuests(user.id);
  return <QuestsPage dailyClaims={dailyClaims} quests={quests} />;
}

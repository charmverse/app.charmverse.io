import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getQuests } from '@packages/scoutgame/quests/getQuests';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { QuestsPage } from '@packages/scoutgame-ui/components/quests/QuestsPage';

export default async function Quests() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const dailyClaims = await getDailyClaims(user.id);
  const quests = await getQuests(user.id);
  return <QuestsPage dailyClaims={dailyClaims} quests={quests} />;
}

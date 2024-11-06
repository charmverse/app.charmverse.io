import { notFound } from 'next/navigation';

import { QuestsPage } from 'components/quests/QuestsPage';
import { getDailyClaims } from 'lib/claims/getDailyClaims';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Quests() {
  const user = await getUserFromSession();

  if (!user) {
    return notFound();
  }

  const dailyClaims = await getDailyClaims(user.id);
  return <QuestsPage dailyClaims={dailyClaims} />;
}

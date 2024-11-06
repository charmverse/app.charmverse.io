import { notFound } from 'next/navigation';

import { QuestsPage } from 'components/quests/QuestsPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';
import { getDailyClaims } from 'lib/users/getDailyClaims';

export default async function Quests() {
  const user = await getUserFromSession();

  if (!user) {
    return notFound();
  }

  const dailyClaims = await getDailyClaims(user.id);
  return <QuestsPage dailyClaims={dailyClaims} />;
}

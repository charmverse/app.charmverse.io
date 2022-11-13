import type { ReactElement } from 'react';

import Invites from 'components/settings/invites/Invites';
import SettingsLayout from 'components/settings/Layout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { setTitle } from 'hooks/usePageTitle';

export default function Pageinvites () {
  setTitle('Invites');
  const space = useCurrentSpace();

  if (!space) {
    return null;
  }

  return (
    <Invites space={space} />
  );
}

Pageinvites.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};

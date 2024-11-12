import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import type { SessionUser } from 'lib/session/getUserFromSession';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: SessionUser }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <ExtraDetailsForm user={user} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

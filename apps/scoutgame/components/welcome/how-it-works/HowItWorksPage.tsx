import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { HowItWorksContent } from './HowItWorksContent';

export function HowItWorksPage() {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <HowItWorksContent />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

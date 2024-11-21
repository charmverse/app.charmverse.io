import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { BuildersYouKnowContent } from './BuildersYouKnowContent';

export function BuildersYouKnowPage() {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <BuildersYouKnowContent />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

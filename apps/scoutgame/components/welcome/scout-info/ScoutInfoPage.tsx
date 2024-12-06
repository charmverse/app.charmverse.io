import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { ScoutInfoContent } from './ScoutInfoContent';

export function ScoutInfoPage({ builder }: { builder: BuilderInfo }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default' maxWidth='350px' height='initial'>
        <ScoutInfoContent builder={builder} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

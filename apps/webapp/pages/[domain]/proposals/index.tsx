import { useTrackOpPageView, useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });
  useTrackOpPageView({ type: 'proposals_list' });

  const { mappedFeatures } = useSpaceFeatures();
  const proposalTitle = mappedFeatures.proposals.title;

  useStaticPageTitle(proposalTitle);

  return (
    <DbViewSettingsProvider>
      <ProposalsProvider>
        <ProposalsBoardProvider>
          <ProposalsPage title={proposalTitle} />
        </ProposalsBoardProvider>
      </ProposalsProvider>
    </DbViewSettingsProvider>
  );
}

ProposalsPageComponent.getLayout = getPageLayout;

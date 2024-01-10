import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });
  const { mappedFeatures } = useSpaceFeatures();
  const proposalTitle = mappedFeatures.proposals.title;

  useStaticPageTitle(proposalTitle);

  return (
    <DbViewSettingsProvider>
      <ProposalsBoardProvider>
        <ProposalsPage title={proposalTitle} />
      </ProposalsBoardProvider>
    </DbViewSettingsProvider>
  );
}

ProposalsPageComponent.getLayout = getPageLayout;

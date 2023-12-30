import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { ProposalsPageProviders } from 'components/proposals/ProposalsPageProviders';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });
  const { mappedFeatures } = useSpaceFeatures();
  const proposalTitle = mappedFeatures.proposals.title;

  useStaticPageTitle(proposalTitle);

  return (
    <ProposalsPageProviders>
      <ProposalsPage title={proposalTitle} />
    </ProposalsPageProviders>
  );
}

ProposalsPageComponent.getLayout = getPageLayout;

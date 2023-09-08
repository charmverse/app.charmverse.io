import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';

export default function ProposalsPageComponent() {
  return <ProposalsPageWithProviders />;
}

ProposalsPageComponent.getLayout = getPageLayout;

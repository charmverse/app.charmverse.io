import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { setTitle } from 'hooks/usePageTitle';

export default function ProposalsPageComponent() {
  setTitle('Proposals');

  return <ProposalsPage />;
}

ProposalsPageComponent.getLayout = getPageLayout;

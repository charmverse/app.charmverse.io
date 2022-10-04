import getPageLayout from 'components/common/PageLayout/getLayout';
import ProposalsPageComponent from 'components/proposals/ProposalsPage';
import { setTitle } from 'hooks/usePageTitle';

export default function ProposalsPage () {

  setTitle('Proposals');

  return (
    <ProposalsPageComponent />
  );

}

ProposalsPage.getLayout = getPageLayout;

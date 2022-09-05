import ProposalsPage from 'components/proposals/ProposalsPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function VotesPage () {

  setTitle('Proposals');

  return (
    <ProposalsPage />
  );

}

VotesPage.getLayout = getPageLayout;

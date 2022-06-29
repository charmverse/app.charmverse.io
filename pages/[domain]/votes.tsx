import VotesPage from 'components/votes/VotesPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function BountyPage () {

  setTitle('Votes');

  return (
    <VotesPage />
  );

}

BountyPage.getLayout = getPageLayout;

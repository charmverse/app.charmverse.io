import VotesPageComponent from 'components/votes/VotesPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function VotesPage () {

  setTitle('Votes');

  return (
    <VotesPageComponent />
  );

}

VotesPage.getLayout = getPageLayout;

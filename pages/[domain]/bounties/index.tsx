import BountyList from 'components/bounties/BountyList';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function BountyPage () {

  setTitle('Bounties');

  return (
    <BountyList />
  );

}

BountyPage.getLayout = getPageLayout;

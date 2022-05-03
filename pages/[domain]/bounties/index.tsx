import BountyList from 'components/bounties/BountyList';
import PageLayout from 'components/common/PageLayout';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement } from 'react';

export default function BountyPage () {

  setTitle('Bounties');

  return (
    <BountyList />
  );

}

BountyPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};

import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import FloatButton from 'components/bounty/FloatButton';

import { ReactElement } from 'react';

export default function BountyPage () {
  return (
    <div position='relative'>
      <BountyCard />
      <FloatButton />
    </div>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};

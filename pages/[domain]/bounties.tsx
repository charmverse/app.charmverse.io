import Box from '@mui/material/Box';
import { BountyList } from 'components/bounties/BountyList';
import PageLayout from 'components/common/PageLayout';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement } from 'react';

export default function BountyPage () {

  setTitle('Bounties');

  return (
    <Box py={3} px='80px'>
      <BountyList />
    </Box>
  );

}

BountyPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};

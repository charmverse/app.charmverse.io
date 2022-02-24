import Box from '@mui/material/Box';
import { BountyList } from 'components/bounties/BountyList';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement } from 'react';

export default function BountyPage () {

  setTitle('Bounties');

  return (
    <Box p={3}>

      <BountyList />
      {
        /*
        <BountyProvider>
        <BountyContainer />
      </BountyProvider>

              <SuggestionProvider>
        <SuggestionContainer />
      </SuggestionProvider>
         */
      }
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

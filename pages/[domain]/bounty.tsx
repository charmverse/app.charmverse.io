import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import FloatButton from 'components/bounty/FloatButton';
import Grid from '@mui/material/Grid';

import { ReactElement } from 'react';

export default function BountyPage () {
  const mockCard = [
    { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', status: 'Not Started', type: 'Content', id: 1 },
    { content: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 2 },
    { content: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 3 },
    { content: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 4 },
    { content: 'A read-me to the feature A we just built', status: 'Not Started', type: 'Content', id: 5 }
  ];
  return (
    <>
      <Grid container direction='row' spacing={3} sx={{ padding: '16px' }}>
        {mockCard.map((card) => (
          <Grid item key={card.id}>
            <BountyCard {...card} />
          </Grid>
        ))}
      </Grid>
      <FloatButton />
    </>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};

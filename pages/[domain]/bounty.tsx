import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import FloatButton from 'components/bounty/FloatButton';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';

import { ReactElement } from 'react';

export default function BountyPage () {
  const mockCard = [
    { title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'content', id: 1 },
    { title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'content', id: 2 },
    { title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'content', id: 3 },
    { title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'content', id: 4 },
    { title: 'A read-me to the feature A we just built', status: 'Not Started', type: 'content', id: 5 }
  ];
  return (
    <>
      <Grid container direction='row' spacing={3}>
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

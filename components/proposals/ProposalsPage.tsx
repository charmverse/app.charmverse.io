import { Box, Grid, Typography } from '@mui/material';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NewProposalButton from 'components/votes/components/NewProposalButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { ProposalWithUsers } from 'lib/proposal/interface';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import ProposalsTable from './components/ProposalsTable';
import ProposalsViewOptions from './components/ProposalsViewOptions';

export default function ProposalsPage () {
  const [currentSpace] = useCurrentSpace();

  const { data, mutate: mutateProposals } = useSWR(() => currentSpace ? `proposals/${currentSpace.id}` : null, () => charmClient.proposals.getProposalsBySpace(currentSpace!.id));

  const [proposals, setProposals] = useState<ProposalWithUsers[]>([]);

  useEffect(() => {
    if (data) {
      setProposals(data);
    }
  }, [data]);

  const loadingData = !data;

  return (
    <CenteredPageContent>
      <Grid container mb={6}>
        <Grid item xs>
          <Typography variant='h1' gutterBottom>
            Proposals
          </Typography>
        </Grid>

        {
            loadingData ? (
              <Grid item xs={12} sx={{ mt: 12 }}>
                <LoadingComponent isLoading size={50} />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} lg={8} display='flex'>
                  <Box gap={3} sx={{ display: 'flex', alignItems: { xs: 'flex-start', lg: 'center' }, width: '100%', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, flexDirection: { xs: 'column-reverse', lg: 'row' } }}>
                    <ProposalsViewOptions
                      proposals={data}
                      setProposals={(proposalsWithUser) => {
                        setProposals(proposalsWithUser);
                      }}
                    />
                    <NewProposalButton mutateProposals={mutateProposals} />
                  </Box>
                </Grid>
                <Grid item xs={12} sx={{ mt: 5 }}>
                  <ProposalsTable proposals={proposals} mutateProposals={mutateProposals} />
                </Grid>
              </>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}

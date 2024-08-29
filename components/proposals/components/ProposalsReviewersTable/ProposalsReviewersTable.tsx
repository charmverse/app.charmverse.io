import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetProposalsReviewers } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function ProposalsReviewersTable() {
  const { space } = useCurrentSpace();
  const { data: proposalsReviewers, isLoading } = useGetProposalsReviewers({
    spaceId: space?.id
  });

  const exportToCSV = useCallback(() => {
    if (space) {
      charmClient.proposals.exportProposalsReviewers({ spaceId: space.id }).then((csvContent) => {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Proposals Reviewers.csv';
        a.click();
      });
    }
  }, [!!space?.id]);

  return (
    <Stack gap={2} mt={2} minWidth={1000}>
      {isLoading || !proposalsReviewers ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Stack gap={1}>
          <Stack flexDirection='row' justifyContent='space-between' my={1}>
            <Typography variant='h6' fontWeight='bold'>
              Reviewers
            </Typography>
            <Button variant='outlined' size='small' onClick={exportToCSV}>
              Export to CSV
            </Button>
          </Stack>
          {proposalsReviewers.length ? (
            <Table>
              <TableHead>
                <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight='bold'>
                      Reviewer
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography variant='body2' fontWeight='bold'>
                      Reviews Left
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography variant='body2' fontWeight='bold'>
                      Reviews Completed
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposalsReviewers.map((proposalsReviewer) => {
                  return (
                    <TableRow key={proposalsReviewer.userId}>
                      <TableCell width={400}>
                        <UserDisplay userId={proposalsReviewer.userId} avatarSize='small' />
                      </TableCell>
                      <TableCell align='center' width={250}>
                        <Typography>{proposalsReviewer.reviewsLeft}</Typography>
                      </TableCell>
                      <TableCell align='center' width={250}>
                        <Typography>{proposalsReviewer.reviewsCompleted}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Card variant='outlined'>
              <Box p={3} textAlign='center'>
                <ProposalIcon fontSize='large' color='secondary' />
                <Typography variant='h6' color='secondary'>
                  No proposal reviews left
                </Typography>
              </Box>
            </Card>
          )}
        </Stack>
      )}
    </Stack>
  );
}

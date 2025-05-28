import { styled } from '@mui/material';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Grid,
  Stack,
  TableRow,
  Typography
} from '@mui/material';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetProposalsReviewers } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { ReviewerProposalsTable } from './ReviewerProposalsTable';

const StyledTableRow = styled(TableRow)`
  cursor: pointer;
  transition: ${({ theme }) =>
    theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shortest
    })};
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    transition: ${({ theme }) =>
      theme.transitions.create('background-color', {
        duration: theme.transitions.duration.shortest
      })};
  }
`;

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
            <Button
              variant='outlined'
              size='small'
              onClick={exportToCSV}
              disabled={!proposalsReviewers.length}
              disabledTooltip='No reviewers to export'
            >
              Export to CSV
            </Button>
          </Stack>
          {proposalsReviewers.length ? (
            <Stack>
              <Stack flexDirection='row' justifyContent='space-between'>
                <Typography fontWeight='bold' align='left' flex={1} p={2} width={400}>
                  Reviewer
                </Typography>
                <Typography fontWeight='bold' align='center' width={250} p={2}>
                  Proposals to review
                </Typography>
              </Stack>
              <Stack>
                {proposalsReviewers.map((proposalsReviewer) => {
                  return (
                    <Accordion
                      key={proposalsReviewer.userId}
                      sx={{
                        '& .MuiAccordionSummary-root': {
                          padding: 0
                        },
                        '& .MuiAccordionDetails-root': {
                          padding: 0
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: 0
                        }
                      }}
                    >
                      <AccordionSummary>
                        <Stack flex={1} p={2} width={400}>
                          <UserDisplay userId={proposalsReviewer.userId} avatarSize='small' />
                        </Stack>
                        <Stack width={250} p={2}>
                          <Typography align='center'>{proposalsReviewer.reviewsLeft}</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        {proposalsReviewer.proposals.length ? (
                          <ReviewerProposalsTable proposals={proposalsReviewer.proposals} />
                        ) : (
                          <Typography p={2} pt={0}>
                            No proposal reviews left for this reviewer
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            </Stack>
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

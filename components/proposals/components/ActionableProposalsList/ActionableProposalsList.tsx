import styled from '@emotion/styled';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Button, Card, CardHeader, CircularProgress, Typography } from '@mui/material';
import { Stack } from '@mui/system';

import { useGetActionableProposals } from 'charmClient/hooks/proposals';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

const StyledCard = styled(Card)`
  .MuiCardHeader-action {
    margin: 0;
  }
`;

export function ActionableProposalsList() {
  const { space } = useCurrentSpace();
  const { data: actionableProposals = [], isLoading } = useGetActionableProposals({
    spaceId: space?.id
  });
  const { navigateToSpacePath } = useCharmRouter();

  return (
    <Stack gap={2} mt={2}>
      {isLoading && (
        <Stack my={2} flexDirection='row' justifyContent='center' alignItems='center'>
          <CircularProgress color='secondary' />
        </Stack>
      )}
      {!isLoading &&
        (actionableProposals.length ? (
          actionableProposals.map((proposal) => {
            const buttonText = proposal.isReviewer
              ? proposal.currentEvaluation?.type === 'vote'
                ? 'Vote'
                : 'Review'
              : 'View';
            return (
              <StyledCard variant='outlined' key={proposal.id}>
                <CardHeader
                  disableTypography
                  title={
                    <Typography variant='h6' fontWeight='bold'>
                      {proposal.title}
                    </Typography>
                  }
                  subheader={
                    <Stack flexDirection='row' gap={2} alignItems='center' my={1}>
                      <Stack flexDirection='row' gap={1} alignItems='center' minWidth={125}>
                        <Typography variant='caption'>Step:</Typography>
                        <Typography variant='subtitle1'>
                          {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title}
                        </Typography>
                      </Stack>
                      {proposal.status === 'published' &&
                        proposal.currentEvaluation?.dueDate &&
                        proposal.isReviewer && (
                          <Stack flexDirection='row' gap={1} alignItems='center' minWidth={250}>
                            <Typography variant='caption'>Due date:</Typography>
                            <Typography
                              variant='subtitle1'
                              color={new Date(proposal.currentEvaluation.dueDate) < new Date() ? 'error' : 'initial'}
                            >
                              {new Date(proposal.currentEvaluation.dueDate).toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                      <Stack flexDirection='row' gap={1} alignItems='center'>
                        <Typography variant='caption'>Last updated:</Typography>
                        <Typography variant='subtitle1'>{new Date(proposal.updatedAt).toLocaleString()}</Typography>
                      </Stack>
                    </Stack>
                  }
                  action={
                    <Button
                      sx={{ width: 100 }}
                      color='primary'
                      onClick={() => {
                        navigateToSpacePath(`/${proposal.path}`);
                      }}
                    >
                      {buttonText}
                    </Button>
                  }
                />
              </StyledCard>
            );
          })
        ) : (
          <Card variant='outlined'>
            <Box p={3} textAlign='center'>
              <ProposalIcon fontSize='large' color='secondary' />
              <Typography color='secondary'>No actionable proposals. Check back later.</Typography>
            </Box>
          </Card>
        ))}
    </Stack>
  );
}

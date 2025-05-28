import { styled } from '@mui/material';
import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { GetProposalsReviewersResponse } from '@packages/lib/proposals/getProposalsReviewers';

import { evaluationIcons } from 'components/settings/proposals/constants';
import { useCharmRouter } from 'hooks/useCharmRouter';

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

export function ReviewerProposalsTable({
  proposals
}: {
  proposals: GetProposalsReviewersResponse[number]['proposals'];
}) {
  const { navigateToSpacePath } = useCharmRouter();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant='body2' fontWeight='bold'>
              Title
            </Typography>
          </TableCell>
          <TableCell align='center'>
            <Typography variant='body2' fontWeight='bold'>
              Status
            </Typography>
          </TableCell>
          <TableCell align='center'>
            <Typography variant='body2' fontWeight='bold'>
              Current step
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {proposals.map((proposal) => {
          return (
            <StyledTableRow key={proposal.id} onClick={() => navigateToSpacePath(`/${proposal.path}`)}>
              <TableCell sx={{ flex: 1 }}>
                <Typography>{proposal.title || 'Untitled'}</Typography>
              </TableCell>
              <TableCell align='center' width={250}>
                <Chip sx={{ px: 0.5 }} label='In progress' color='gray' size='small' />
              </TableCell>
              <TableCell width={250}>
                <Stack direction='row' justifyContent='center' alignItems='center' gap={1}>
                  {evaluationIcons[proposal.currentEvaluation.type]()}
                  <Typography>{proposal.currentEvaluation.title || 'Evaluation'}</Typography>
                </Stack>
              </TableCell>
            </StyledTableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

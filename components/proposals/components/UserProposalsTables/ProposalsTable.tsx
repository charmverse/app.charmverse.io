import styled from '@emotion/styled';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { UserProposal } from '@root/lib/proposals/getUserProposals';
import { relativeTime } from '@root/lib/utils/dates';
import { useRouter } from 'next/router';

import { evaluationIcons } from 'components/settings/proposals/constants';

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

export function ProposalsTable({ proposals, title }: { title: string; proposals: UserProposal[] }) {
  const router = useRouter();

  return (
    <Stack gap={1}>
      <Typography variant='h6' fontWeight='bold'>
        {title}
      </Typography>
      {proposals.length ? (
        <Table>
          <TableHead>
            <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
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
                  Last updated
                </Typography>
              </TableCell>
              <TableCell align='left'>
                <Typography variant='body2' fontWeight='bold'>
                  Current step
                </Typography>
              </TableCell>
              <TableCell align='center'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => {
              return (
                <StyledTableRow
                  key={proposal.id}
                  onClick={() => {
                    router.push(`/${router.query.domain}/${proposal.path}`);
                  }}
                >
                  <TableCell width={250}>
                    <Typography>{proposal.title || 'Untitled'}</Typography>
                  </TableCell>
                  <TableCell align='center' width={200}>
                    {proposal.currentEvaluation?.result ? (
                      <Typography>{proposal.currentEvaluation.result ? 'Passed' : 'Failed'}</Typography>
                    ) : (
                      <Typography>In progress</Typography>
                    )}
                  </TableCell>
                  <TableCell align='center' width={250}>
                    <Typography>{relativeTime(proposal.updatedAt)}</Typography>
                  </TableCell>
                  <TableCell align='left' width={250}>
                    <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={1}>
                      {proposal.currentEvaluation && evaluationIcons[proposal.currentEvaluation.type]()}
                      <Typography>
                        {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align='center'></TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <ProposalIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No proposals left for review. Check back later.</Typography>
          </Box>
        </Card>
      )}
    </Stack>
  );
}

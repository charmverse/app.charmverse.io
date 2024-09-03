import styled from '@emotion/styled';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
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

export function ActionableProposalsTable({ proposals }: { proposals: UserProposal[] }) {
  const router = useRouter();

  return (
    <Stack gap={1}>
      <Typography variant='h6' fontWeight='bold'>
        Ready for review
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
                  Due date
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
              <TableCell align='center'>
                <Typography variant='body2' fontWeight='bold'>
                  Action
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => {
              const buttonText =
                proposal.currentEvaluation?.type === 'vote'
                  ? 'Vote'
                  : proposal.currentEvaluation?.type === 'sign_documents'
                  ? 'Sign'
                  : 'Review';

              let isOverdue = false;
              let dueDateText = '-';
              if (proposal.currentEvaluation?.dueDate) {
                if (new Date(proposal.currentEvaluation.dueDate) < new Date()) {
                  isOverdue = true;
                  dueDateText = 'Overdue';
                } else {
                  const formattedDueDate = new Date(proposal.currentEvaluation.dueDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  });

                  const formattedTime = new Date(proposal.currentEvaluation.dueDate).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                  });

                  dueDateText = `${formattedDueDate} ${formattedTime}`;
                }
              }

              return (
                <StyledTableRow
                  key={proposal.id}
                  onClick={() => {
                    router.push(`/${router.query.domain}/${proposal.path}`);
                  }}
                >
                  <TableCell width={400}>
                    <Typography>{proposal.title || 'Untitled'}</Typography>
                  </TableCell>
                  <TableCell align='center' width={200}>
                    <Typography color={isOverdue ? 'error' : 'initial'}>{dueDateText}</Typography>
                  </TableCell>
                  <TableCell align='center' width={250}>
                    <Typography>{relativeTime(proposal.updatedAt)}</Typography>
                  </TableCell>
                  <TableCell width={250}>
                    <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={1}>
                      {proposal.currentEvaluation && evaluationIcons[proposal.currentEvaluation.type]()}
                      <Typography>
                        {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title || 'Evaluation'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align='center' width={250}>
                    <Button
                      color='primary'
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${router.query.domain}/${proposal.path}`);
                      }}
                    >
                      {buttonText}
                    </Button>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <ProposalIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No actionable proposals. Check back later.</Typography>
          </Box>
        </Card>
      )}
    </Stack>
  );
}

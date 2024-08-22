import styled from '@emotion/styled';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { ActionableUserProposal } from '@root/lib/proposals/getUserProposals';
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

export function ActionableProposalsTable({ proposals }: { proposals: ActionableUserProposal[] }) {
  const router = useRouter();

  return (
    <Stack gap={1}>
      <Typography variant='h6' fontWeight='bold'>
        My Actions
      </Typography>
      {proposals.length ? (
        <Table>
          <TableHead>
            <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
              <TableCell>Title</TableCell>
              <TableCell align='center'>Step</TableCell>
              <TableCell align='center'>Due date</TableCell>
              <TableCell align='center'>Last updated</TableCell>
              <TableCell align='center'>Action</TableCell>
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
                  <TableCell>
                    <Typography>{proposal.title}</Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
                      {evaluationIcons[proposal.currentEvaluation.type]()}
                      <Typography>
                        {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography color={isOverdue ? 'error' : 'initial'}>{dueDateText}</Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography>{relativeTime(proposal.updatedAt)}</Typography>
                  </TableCell>
                  <TableCell align='center'>
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

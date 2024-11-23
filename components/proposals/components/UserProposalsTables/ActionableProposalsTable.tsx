import { ThumbUpOutlined as ApprovedIcon, HighlightOff as RejectedIcon } from '@mui/icons-material';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { CustomColumn, UserProposal } from '@root/lib/proposals/getUserProposals';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { evaluationIcons } from 'components/settings/proposals/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { CustomColumnTableCells } from './CustomColumnTableCells';
import { OpenButton, StyledTable, StyledTableRow } from './ProposalsTable';

export function ActionableProposalsTable({
  proposals,
  customColumns,
  totalProposals
}: {
  proposals: UserProposal[];
  customColumns: CustomColumn[];
  totalProposals: number;
}) {
  const { space } = useCurrentSpace();

  const router = useRouter();

  const exportToCSV = useCallback(() => {
    if (space) {
      charmClient.proposals.exportUserProposals({ spaceId: space.id }).then((csvContent) => {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'My Proposals.csv';
        a.click();
      });
    }
  }, [!!space?.id]);

  return (
    <Stack gap={1}>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          Ready for review
        </Typography>
        <Button
          variant='outlined'
          size='small'
          onClick={exportToCSV}
          disabled={totalProposals === 0}
          disabledTooltip='No proposals to export'
        >
          Export to CSV
        </Button>
      </Stack>
      {proposals.length ? (
        <StyledTable>
          <TableHead>
            <TableRow>
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
              <TableCell align='left'>
                <Typography variant='body2' fontWeight='bold'>
                  Current step
                </Typography>
              </TableCell>
              <TableCell align='center'>
                <Typography variant='body2' fontWeight='bold'>
                  Your review
                </Typography>
              </TableCell>
              <TableCell align='center'>
                <Typography variant='body2' fontWeight='bold'>
                  Approved
                </Typography>
              </TableCell>
              <TableCell align='center'>
                <Typography variant='body2' fontWeight='bold'>
                  Declined
                </Typography>
              </TableCell>
              {customColumns.map((column) => (
                <TableCell key={column.formFieldId} align='center'>
                  <Typography variant='body2' fontWeight='bold'>
                    {column.title}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align='right'>
                <Typography variant='body2' fontWeight='bold' sx={{ pr: 4 }}>
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
                  <TableCell sx={{ minWidth: 250 }}>
                    <Stack
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexDirection: 'row'
                      }}
                    >
                      <Typography>{proposal.title || 'Untitled'}</Typography>
                      <Link href={`/${proposal.path}`} onClick={(e) => e.stopPropagation()}>
                        <OpenButton />
                      </Link>
                    </Stack>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{
                      minWidth: 150
                    }}
                  >
                    <Typography color={isOverdue ? 'error' : 'initial'}>{dueDateText}</Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: 150
                    }}
                  >
                    <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={1}>
                      {proposal.currentEvaluation && evaluationIcons[proposal.currentEvaluation.type]()}
                      <Typography>
                        {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title || 'Evaluation'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align='center' sx={{ minWidth: 100 }}>
                    <Typography
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {proposal.userReviewResult === 'pass' ? (
                        <ApprovedIcon fontSize='small' color='success' />
                      ) : proposal.userReviewResult === 'fail' ? (
                        <RejectedIcon fontSize='small' color='error' />
                      ) : (
                        '-'
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align='center' width={150}>
                    <Typography color={proposal.totalPassedReviewResults ? 'success' : undefined}>
                      {proposal.totalPassedReviewResults || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='center' width={150}>
                    <Typography color={proposal.totalFailedReviewResults ? 'error' : undefined}>
                      {proposal.totalFailedReviewResults || '-'}
                    </Typography>
                  </TableCell>
                  <CustomColumnTableCells customColumns={customColumns} proposal={proposal} />
                  <TableCell align='right' width={150}>
                    <Button
                      color='primary'
                      size='small'
                      sx={{ mr: 2, width: 75 }}
                      onClick={(e: MouseEvent) => {
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
        </StyledTable>
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

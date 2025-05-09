import styled from '@emotion/styled';
import { ThumbUpOutlined as ApprovedIcon, HighlightOff as RejectedIcon } from '@mui/icons-material';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { CustomColumn, UserProposal } from '@packages/lib/proposals/getUserProposals';
import { relativeTime } from '@packages/lib/utils/dates';
import { useState } from 'react';

import Button from 'components/common/DatabaseEditor/widgets/buttons/button';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { evaluationIcons } from 'components/settings/proposals/constants';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { CustomColumnTableCells } from './CustomColumnTableCells';

export const StyledTable = styled(Table)`
  .MuiTableCell-root {
    padding: 10px;
    position: relative;
  }
  th {
    color: rgba(var(--center-channel-color-rgb), 0.6);
  }
`;

export const StyledTableRow = styled(TableRow)`
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

    .open-button {
      display: block;
    }
  }
  .open-button {
    display: none;
  }
`;

export function OpenButton() {
  return (
    <div className='open-button'>
      <Button>Open</Button>
    </div>
  );
}

export function ProposalsTable({
  proposals,
  title,
  assigned = false,
  customColumns = []
}: {
  title: string;
  proposals: UserProposal[];
  assigned?: boolean;
  customColumns?: CustomColumn[];
}) {
  const { navigateToSpacePath } = useCharmRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { getFeatureTitle } = useSpaceFeatures();

  return (
    <Stack gap={1}>
      <Typography variant='h6' fontWeight='bold'>
        {title}
      </Typography>
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
                  Status
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
              <TableCell align='center'>
                {assigned ? (
                  <Typography variant='body2' fontWeight='bold'>
                    Reviewed at
                  </Typography>
                ) : null}
              </TableCell>
              {customColumns.map((column) => (
                <TableCell key={column.formFieldId} align='center'>
                  <Typography variant='body2' fontWeight='bold'>
                    {column.title}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => {
              const result = proposal.currentEvaluation?.result;
              const statusLabel = result ? (result === 'pass' ? 'Passed' : 'Declined') : 'In progress';
              const rubricAnswers = proposal.currentEvaluation?.rubricAnswers || [];
              const averageAnswer = rubricAnswers.length
                ? rubricAnswers.reduce((acc, answer) => acc + answer.response.score, 0) / rubricAnswers.length
                : 0;

              return (
                <StyledTableRow
                  key={proposal.id}
                  onClick={() => {
                    if (!proposal.viewable) {
                      setIsOpen(true);
                    } else {
                      navigateToSpacePath(`/${proposal.path}`);
                    }
                  }}
                >
                  <TableCell
                    sx={{
                      minWidth: 250
                    }}
                  >
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
                  <TableCell align='center' width={200}>
                    <Chip
                      sx={{ px: 0.5 }}
                      label={statusLabel}
                      color={result === 'fail' ? 'red' : result === 'pass' ? 'green' : 'gray'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell
                    align='left'
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

                  <TableCell align='center' sx={{ minWidth: 150 }}>
                    <Typography
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {proposal.currentEvaluation?.type === 'rubric' && averageAnswer > 0 ? (
                        <Typography>{averageAnswer.toFixed(2)}</Typography>
                      ) : proposal.userReviewResult === 'pass' ? (
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
                  <TableCell width={150} align='center'>
                    {assigned ? (proposal.reviewedAt ? relativeTime(proposal.reviewedAt) : '-') : null}
                  </TableCell>
                  <CustomColumnTableCells customColumns={customColumns} proposal={proposal} />
                </StyledTableRow>
              );
            })}
          </TableBody>
        </StyledTable>
      ) : (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <ProposalIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No proposals left for review. Check back later.</Typography>
          </Box>
        </Card>
      )}
      <Modal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title={`${getFeatureTitle('Proposal')} not viewable`}
      >
        <Typography>You currently don't have view access to this {getFeatureTitle('proposal')}</Typography>
      </Modal>
    </Stack>
  );
}

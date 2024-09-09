import styled from '@emotion/styled';
import ProposalIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { UserProposal } from '@root/lib/proposals/getUserProposals';
import { relativeTime } from '@root/lib/utils/dates';
import { useState } from 'react';

import Button from 'components/common/DatabaseEditor/widgets/buttons/button';
import Modal from 'components/common/Modal';
import { evaluationIcons } from 'components/settings/proposals/constants';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

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
    position: absolute;
    right: 0;
    top: 13px;
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
  assigned = false
}: {
  title: string;
  proposals: UserProposal[];
  assigned?: boolean;
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
                {assigned ? (
                  <Typography variant='body2' fontWeight='bold'>
                    Reviewed at
                  </Typography>
                ) : null}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => {
              const result = proposal.currentEvaluation?.result;
              const statusLabel = result ? (result === 'pass' ? 'Passed' : 'Declined') : 'In progress';
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
                    width={400}
                    sx={{
                      pl: 0
                    }}
                  >
                    <Typography>{proposal.title || 'Untitled'}</Typography>
                    <OpenButton />
                  </TableCell>
                  <TableCell align='center' width={200}>
                    <Chip
                      sx={{ px: 0.5 }}
                      label={statusLabel}
                      color={result === 'fail' ? 'red' : result === 'pass' ? 'green' : 'gray'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='center' width={250}>
                    <Typography>{relativeTime(proposal.updatedAt)}</Typography>
                  </TableCell>
                  <TableCell align='left' width={250}>
                    <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={1}>
                      {proposal.currentEvaluation && evaluationIcons[proposal.currentEvaluation.type]()}
                      <Typography>
                        {proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title || 'Evaluation'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell width={250} align='center'>
                    {assigned ? (proposal.reviewedAt ? relativeTime(proposal.reviewedAt) : '-') : null}
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

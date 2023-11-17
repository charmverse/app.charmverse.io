import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { Check } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Box,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button } from 'components/common/Button';
import { MiniOpenButton } from 'components/common/MiniOpenButton';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';

import { RubricResultDetailsModal } from './RubricResultDetailsModal';

type Props = {
  answers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteriaList: ProposalRubricCriteria[];
  reviewerUserIds: string[];
};

type CriteriaSummaryType = 'sum' | 'average';

export function RubricResults({ criteriaList = [], answers = [], reviewerUserIds = [] }: Props) {
  const userContainerRef = useRef<HTMLDivElement>(null);
  const [maxColWidth, setMaxColWidth] = useState<number | undefined>(undefined);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaSummaryType, setCriteriaSummaryType] = useState<CriteriaSummaryType>('average');
  const { criteriaSummary, reviewersResults, allScores } = aggregateResults({
    criteria: criteriaList,
    answers
  });

  const { getMemberById } = useMembers();

  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const summaryTypeLabel = criteriaSummaryType === 'average' ? 'Average' : 'Sum';

  useLayoutEffect(() => {
    if (userContainerRef.current) {
      setMaxColWidth(userContainerRef.current.clientWidth + 1);
    }
  }, []);

  const selectSummaryType = (type: CriteriaSummaryType) => {
    setCriteriaSummaryType(type);
    setAnchorEl(null);
  };

  // Also include reviewers that haven't answered yet
  const listWithAllReviewers = useMemo(() => {
    const answerList = Object.values(reviewersResults);

    // Also add in reviewers that have not responded yet
    for (const reviewer of reviewerUserIds) {
      if (!reviewersResults[reviewer]) {
        answerList.push({ id: reviewer, answersMap: {}, average: null, sum: null });
      }
    }
    return answerList;
  }, [criteriaList, answers, reviewerUserIds]);

  return (
    <TableContainer sx={{ maxHeight: '500px' }}>
      <Table aria-label='simple table' stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                position: 'sticky',
                left: 0,
                top: 0,
                zIndex: 3,
                background: 'var(--background-default)',
                borderRight: '1px solid var(--input-border)'
              }}
            >
              <Stack direction='row' ref={userContainerRef} width='100%'>
                Reviewer
              </Stack>
            </TableCell>

            {criteriaList.map((c) => (
              <TableCell key={c.id}>{c.title}</TableCell>
            ))}

            <TableCell>{summaryTypeLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listWithAllReviewers.map((r) => (
            <TableRow
              onClick={() => setDetailsUserId(r.id)}
              key={r.id}
              hover
              sx={{
                '&:not(:hover)': {
                  background: 'var(--background-default)'
                },
                '&:hover .popup-open-handle': {
                  display: 'inline-flex'
                },
                cursor: 'pointer'
              }}
            >
              <TableCell
                component='th'
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  borderRight: '1px solid var(--input-border)'
                }}
              >
                <Box maxWidth={maxColWidth} width={maxColWidth ? `${maxColWidth}px` : 'auto'}>
                  <Stack direction='row' alignItems='center' gap={1}>
                    <UserDisplay avatarSize='small' user={getMemberById(r.id)} hideName />
                    <Typography noWrap>{getMemberById(r.id)?.username}</Typography>
                    <Stack className='popup-open-handle' display='none'>
                      <MiniOpenButton />
                    </Stack>
                  </Stack>
                </Box>
              </TableCell>

              {criteriaList.map((c) => (
                <TableCell key={c.id}>{r.answersMap[c.id]?.score || '-'}</TableCell>
              ))}

              <TableCell>{roundNumber(r[criteriaSummaryType]) || '-'}</TableCell>
            </TableRow>
          ))}

          <TableRow sx={{ 'td, th': { borderBottom: 0 } }}>
            <TableCell
              component='th'
              sx={{
                textAlign: 'right',
                position: 'sticky',
                left: 0,
                zIndex: 1,
                background: 'var(--background-default)',
                borderRight: '1px solid var(--input-border)'
              }}
            >
              <Button
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  setAnchorEl(event.currentTarget);
                }}
                variant='text'
                color='inherit'
              >
                {summaryTypeLabel}
              </Button>

              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => selectSummaryType('average')} sx={{ alignContent: 'space-between', gap: 1 }}>
                  <span>Average</span>
                  <ListItemIcon sx={{ visibility: criteriaSummaryType === 'average' ? 'visible' : 'hidden' }}>
                    <Check />
                  </ListItemIcon>
                </MenuItem>
                <MenuItem onClick={() => selectSummaryType('sum')} sx={{ alignContent: 'space-between', gap: 1 }}>
                  <span>Sum</span>
                  <ListItemIcon sx={{ visibility: criteriaSummaryType === 'sum' ? 'visible' : 'hidden' }}>
                    <Check />
                  </ListItemIcon>
                </MenuItem>
              </Menu>
            </TableCell>

            {criteriaList.map((c) => (
              <TableCell key={c.id}>{roundNumber(criteriaSummary[c.id]?.[criteriaSummaryType]) || '-'}</TableCell>
            ))}
            <TableCell>{roundNumber(allScores[criteriaSummaryType]) || '-'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <RubricResultDetailsModal
        isOpen={!!detailsUserId}
        onClose={() => setDetailsUserId(null)}
        title={`Evaluation results"`}
        reviewerId={detailsUserId}
        reviewerResults={detailsUserId ? reviewersResults[detailsUserId] : undefined}
        criteriaList={criteriaList}
      />
    </TableContainer>
  );
}

function roundNumber(num: number | undefined | null): string | undefined {
  return num?.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

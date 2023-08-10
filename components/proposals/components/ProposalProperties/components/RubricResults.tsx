import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { Check } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { ProposalReviewerInput } from 'lib/proposal/interface';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';

type Props = {
  answers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteriaList: ProposalRubricCriteria[];
  reviewers: ProposalReviewerInput[];
};

type CriteriaSummaryType = 'sum' | 'average';

export function RubricResults({ criteriaList = [], answers = [], reviewers = [] }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaSummaryType, setCriteriaSummaryType] = useState<CriteriaSummaryType>('average');
  const { criteriaSummary, reviewersResults, allScores } = aggregateResults({
    criteria: criteriaList,
    answers
  });
  const { getMemberById } = useMembers();

  const summaryTypeLabel = criteriaSummaryType === 'average' ? 'Average' : 'Sum';

  const selectSummaryType = (type: CriteriaSummaryType) => {
    setCriteriaSummaryType(type);
    setAnchorEl(null);
  };

  // Also include reviewers that haven't answered yet
  const listWithAllReviewers = useMemo(() => {
    const answerList = Object.values(reviewersResults);

    // Also add in reviewers that have not responded yet
    for (const reviewer of reviewers) {
      if (!reviewersResults[reviewer.id]) {
        answerList.push({ id: reviewer.id, answersMap: {}, average: null, sum: null });
      }
    }
    return answerList;
  }, [criteriaList, answers, reviewers]);

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
              Reviewer
            </TableCell>

            {criteriaList.map((c) => (
              <TableCell key={c.id}>{c.title}</TableCell>
            ))}

            <TableCell>{summaryTypeLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listWithAllReviewers.map((r) => (
            <TableRow key={r.id}>
              <TableCell
                component='th'
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  background: 'var(--background-default)',
                  borderRight: '1px solid var(--input-border)'
                }}
              >
                <UserDisplay avatarSize='small' user={getMemberById(r.id)} showMiniProfile />
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
    </TableContainer>
  );
}

function roundNumber(num: number | undefined | null): string | undefined {
  return num?.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

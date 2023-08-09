import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useState } from 'react';

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
  const [criteriaSummaryType, setCriteriaSummaryType] = useState<CriteriaSummaryType>('average');
  const { criteriaSummary, reviewersResults } = aggregateResults({ criteria: criteriaList, answers, reviewers });

  const { getMemberById } = useMembers();

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

            <TableCell>Average</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reviewersResults.map((r) => (
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
                <UserDisplay user={getMemberById(r.id)} showMiniProfile />
              </TableCell>

              {criteriaList.map((c) => (
                <TableCell key={c.id}>{r.answersMap[c.id]?.score || '-'}</TableCell>
              ))}

              <TableCell>{r.average || '-'}</TableCell>
            </TableRow>
          ))}

          <TableRow>
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
              Average
            </TableCell>

            {criteriaList.map((c) => (
              <TableCell key={c.id}>{criteriaSummary[c.id]?.[criteriaSummaryType] || '-'}</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

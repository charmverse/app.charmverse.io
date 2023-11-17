import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ArrowForwardIosSharp, Check } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { AccordionProps, AccordionSummaryProps } from '@mui/material';
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
  Typography,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Accordion as MuiAccordion
} from '@mui/material';
import { mean, sum } from 'lodash';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button } from 'components/common/Button';
import { MiniOpenButton } from 'components/common/MiniOpenButton';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import { isNumber } from 'lib/utilities/numbers';

import { RubricResultDetailsModal } from './RubricResultDetailsModal';

type Props = {
  answers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteriaList: ProposalRubricCriteria[];
  reviewerUserIds: string[];
};

type CriteriaSummaryType = 'sum' | 'average';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  ({ theme }) => ({
    border: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:before': {
      display: 'none'
    }
  })
);

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
  // backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)'
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1)
  }
}));

export function RubricResults({ criteriaList = [], answers: allAnswers = [], reviewerUserIds = [] }: Props) {
  const userContainerRef = useRef<HTMLDivElement>(null);
  const [maxColWidth, setMaxColWidth] = useState<number | undefined>(undefined);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaSummaryType, setCriteriaSummaryType] = useState<CriteriaSummaryType>('average');
  // const { criteriaSummary, reviewersResults, allScores } = aggregateResults({
  //   criteria: criteriaList,
  //   answers
  // });

  const { membersRecord } = useMembers();

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
  // const listWithAllReviewers = useMemo(() => {
  //   const answerList = Object.values(reviewersResults);

  //   // Also add in reviewers that have not responded yet
  //   for (const reviewer of reviewerUserIds) {
  //     if (!reviewersResults[reviewer]) {
  //       answerList.push({ id: reviewer, answersMap: {}, average: null, sum: null });
  //     }
  //   }
  //   return answerList;
  // }, [criteriaList, answers, reviewerUserIds]);
  const [expandedCriteria, setExpandedCriteria] = useState<string | false>(false);

  const populatedCriteria = criteriaList.map((criteria) => {
    const criteriaAnswers = allAnswers.filter((answer) => answer.rubricCriteriaId === criteria.id);
    const parameters = criteria.parameters as { min: number; max: number };
    const criteriaMax = parameters.max;
    const totalDenominator = criteriaMax * criteriaAnswers.length;
    const allScores = criteriaAnswers.map((answer) => answer.response.score).filter(isNumber);
    const averageResult = mean(allScores);
    const totalResult = sum(allScores);
    return {
      id: criteria.id,
      title: criteria.title,
      hasAnswers: allScores.length > 0,
      averageResult,
      totalResult,
      totalDenominator,
      criteriaMax,
      answers: criteriaAnswers.map((answer) => {
        const {
          userId,
          comment,
          response: { score }
        } = answer;
        return {
          userId,
          score,
          comment
        };
      })
    };
  });

  const allCriteriaScores = populatedCriteria.map((criteria) => criteria.totalResult);
  const allCriteriaAverage = mean(allCriteriaScores);
  const allCriteriaTotal = sum(allCriteriaScores);
  const allCriteriaTotalDenominator = sum(populatedCriteria.map((criteria) => criteria.totalDenominator));

  function expandCriteria(criteriaId: string) {
    return (event: any, isExpanded: boolean) => {
      setExpandedCriteria(isExpanded ? criteriaId : false);
    };
  }

  return (
    <>
      {populatedCriteria.map((criteria) => (
        <Accordion key={criteria.id} expanded={expandedCriteria === criteria.id} onChange={expandCriteria(criteria.id)}>
          <AccordionSummary>
            <Box display='flex' justifyContent='space-between' width='100%'>
              <Typography>{criteria.title}</Typography>
              <span>
                {criteria.hasAnswers ? (
                  criteriaSummaryType === 'average' ? (
                    <strong>{criteria.averageResult}</strong>
                  ) : (
                    <>
                      <strong>{criteria.totalResult}</strong>
                      <Typography color='secondary' component='span'>
                        {' '}
                        / {criteria.totalDenominator}
                      </Typography>
                    </>
                  )
                ) : (
                  <Typography color='secondary'>N/A</Typography>
                )}
              </span>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {criteria.answers.map((answer) => (
              <>
                <Box display='flex' justifyContent='space-between' width='100%' key={answer.userId}>
                  <UserDisplay avatarSize='xSmall' user={membersRecord[answer.userId]} />
                  <span>
                    {answer.score}
                    <Typography color='secondary' component='span'>
                      {' '}
                      / {criteria.criteriaMax}
                    </Typography>
                  </span>
                </Box>
                <Typography color='secondary' variant='body2' paragraph sx={{ ml: 3.5 }}>
                  {answer.comment}
                </Typography>
              </>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
      <Box display='flex' alignItems='center' justifyContent='space-between' width='100%' py={1} px={2}>
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
        {allCriteriaScores.length ? (
          criteriaSummaryType === 'average' ? (
            <strong>{allCriteriaAverage}</strong>
          ) : (
            <span>
              <strong>{allCriteriaTotal}</strong>
              <Typography color='secondary' component='span'>
                {' '}
                / {allCriteriaTotalDenominator}
              </Typography>
            </span>
          )
        ) : (
          <Typography color='secondary'>N/A</Typography>
        )}
      </Box>
    </>
  );
}

function roundNumber(num: number | undefined | null): string | undefined {
  return num?.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

import type { ProposalRubricCriteria } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { ArrowForwardIosSharp, Check } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { AccordionProps, AccordionSummaryProps } from '@mui/material';
import {
  Box,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Accordion as MuiAccordion
} from '@mui/material';
import { mean, sum } from 'lodash';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { aggregateResults } from 'lib/proposals/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposals/rubric/interfaces';
import { isNumber } from 'lib/utils/numbers';

type Props = {
  answers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteriaList: ProposalRubricCriteria[];
  evaluation?: PopulatedEvaluation;
  showReviewerIdentities: boolean;
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

export function RubricResults({
  criteriaList = [],
  answers: allAnswers = [],
  evaluation,
  showReviewerIdentities
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaSummaryType, setCriteriaSummaryType] = useState<CriteriaSummaryType>('average');

  const summaryTypeLabel = criteriaSummaryType === 'average' ? 'Average' : 'Sum';

  const selectSummaryType = (type: CriteriaSummaryType) => {
    setCriteriaSummaryType(type);
    setAnchorEl(null);
  };

  const [expandedCriteria, setExpandedCriteria] = useState<string | false>(false);

  const populatedCriteria = criteriaList.map((criteria) => {
    const criteriaAnswers = allAnswers.filter((answer) => answer.rubricCriteriaId === criteria.id);
    const parameters = criteria.parameters as { min: number; max: number };
    const criteriaMax = parameters.max;
    const totalDenominator = criteriaMax * criteriaAnswers.length;
    const allScores = criteriaAnswers.map((answer) => answer.response.score).filter(isNumber);
    const averageResult = roundNumber(mean(allScores));
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

  const { allScores, criteriaSummary } = aggregateResults({
    answers: allAnswers,
    criteria: evaluation?.rubricCriteria || []
  });

  const allCriteriaScores = Object.values(criteriaSummary).map((v) => v.sum);

  const allCriteriaTotalDenominator = sum(populatedCriteria.map((criteria) => criteria.totalDenominator));

  function expandCriteria(criteriaId: string) {
    return (event: any, isExpanded: boolean) => {
      setExpandedCriteria(isExpanded ? criteriaId : false);
    };
  }

  useEffect(() => {
    // Expand the first criteria if there is only one
    if (populatedCriteria.length === 1) {
      setExpandedCriteria(populatedCriteria[0].id);
    }
  }, [populatedCriteria?.length]);

  return (
    <>
      <Typography variant='subtitle1' sx={{ mt: 1, ml: 2 }}>
        Questions
      </Typography>
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
                  <UserDisplay avatarSize='xSmall' userId={answer.userId} hideIdentity={!showReviewerIdentities} />
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
          color='secondary'
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
            <strong>{allScores.average}</strong>
          ) : (
            <span>
              <strong>{allScores.sum}</strong>
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

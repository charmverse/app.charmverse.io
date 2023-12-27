import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import { ArrowForwardIosSharp, ExpandMore } from '@mui/icons-material';
import {
  Accordion as MuiAccordion,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Box,
  Typography
} from '@mui/material';
import type { AccordionProps, AccordionSummaryProps } from '@mui/material';
import { useEffect, useState } from 'react';

import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { WorkflowSelect } from '../WorkflowSelect';

import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { RubricEvaluation } from './components/RubricEvaluation/RubricEvaluation';
import { StepperIcon } from './components/StepperIcon';
import { VoteEvaluation } from './components/VoteEvaluation';

export type Props = {
  pageId?: string;
  isTemplate?: boolean;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    | 'id'
    | 'authors'
    | 'evaluations'
    | 'permissions'
    | 'status'
    | 'evaluationType'
    | 'workflowId'
    | 'currentEvaluationId'
  >;
  refreshProposal?: VoidFunction;
  // workflowOptions?: ProposalWorkflowTyped[];
};

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  ({ theme }) => ({
    border: 0,
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:before': {
      display: 'none'
    }
  })
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ExpandMore />} {...props} />
))(({ theme }) => ({
  // backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
  // flexDirection: 'row-reverse',
  // '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
  //   transform: 'rotate(90deg)'
  // },
  // '& .MuiAccordionSummary-content': {
  //   marginLeft: theme.spacing(1)
  // }
}));
const expandableEvaluationTypes: ProposalEvaluationType[] = ['pass_fail', 'rubric', 'vote'];

export function EvaluationSidebar({ pageId, isTemplate, proposal, refreshProposal }: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations || []);
  // const evaluationToShowInSidebar = proposal?.permissions.evaluate && proposal?.currentEvaluationId;
  // let evaluationToShowInSidebar: string | undefined;
  // const currentEvaluation = getCurrentEvaluation(proposal?.evaluations ?? []);
  // if (currentEvaluation && evaluationTypesWithSidebar.includes(currentEvaluation.type)) {
  //   evaluationToShowInSidebar = currentEvaluation.id;
  // }
  useEffect(() => {
    // open current evaluation by default
    if (proposal?.currentEvaluationId) {
      setActiveEvaluationId(proposal.currentEvaluationId);
    }
  }, [proposal?.currentEvaluationId, setActiveEvaluationId]);

  return (
    <div>
      <Box mb={1}>
        <WorkflowSelect value={proposal?.workflowId} readOnly />
      </Box>
      <Accordion
        expanded={activeEvaluationId === 'draft'}
        onChange={(e, expand) => setActiveEvaluationId(expand ? 'draft' : undefined)}
      >
        <AccordionSummary>
          <Box display='flex' alignItems='center' gap={1}>
            <StepperIcon
              result={proposal?.currentEvaluationId ? 'pass' : null}
              isCurrent={!proposal?.currentEvaluationId}
              position={1}
            />
            <Typography variant='h6'>Draft</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails></AccordionDetails>
      </Accordion>
      {proposal?.evaluations.map((evaluation, index) => (
        <Accordion
          key={evaluation.id}
          expanded={evaluation.id === activeEvaluationId}
          onChange={(e, expand) => setActiveEvaluationId(expand ? evaluation.id : undefined)}
        >
          <AccordionSummary>
            <Box display='flex' alignItems='center' gap={1}>
              <StepperIcon
                result={evaluation.result}
                isCurrent={evaluation.id === proposal?.currentEvaluationId}
                position={index + 2}
              />
              {/* {evaluationIcons[evaluation.type]()} */}
              <Typography variant='h6'>{evaluation.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {evaluation?.type === 'feedback' && (
              <FeedbackEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={activeEvaluationId === evaluation.id}
                nextStep={proposal.evaluations[index + 1]}
                hasMovePermission={proposal.permissions.move}
                onSubmit={refreshProposal}
              />
            )}
            {evaluation?.type === 'pass_fail' && (
              <PassFailEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={activeEvaluationId === evaluation.id}
                isReviewer={proposal?.permissions.evaluate}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation?.type === 'rubric' && (
              <RubricEvaluation
                key={evaluation.id}
                proposal={proposal}
                isCurrent={activeEvaluationId === evaluation.id}
                evaluation={evaluation}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation?.type === 'vote' && (
              <VoteEvaluation
                key={evaluation.id}
                pageId={pageId!}
                proposal={proposal}
                isCurrent={activeEvaluationId === evaluation.id}
                evaluation={evaluation}
              />
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

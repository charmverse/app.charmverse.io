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
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { WorkflowSelect } from '../WorkflowSelect';

import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { PublishRewardsButton } from './components/PublishRewardsButton';
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
    | 'fields'
    | 'rewardIds'
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

const AccordionSummary = styled(({ hideExpand, ...props }: AccordionSummaryProps & { hideExpand?: boolean }) => (
  <MuiAccordionSummary expandIcon={hideExpand ? null : <ExpandMore />} {...props} />
))();

export function EvaluationSidebar({ pageId, isTemplate, proposal, refreshProposal }: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);

  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = (proposal?.fields as ProposalFields)?.pendingRewards;
  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = !!pendingRewards?.length || isRewardsComplete;
  const isRewardsActive = currentEvaluation?.result === 'pass';

  useEffect(() => {
    // expand the current evaluation
    if (proposal?.currentEvaluationId) {
      if (isRewardsActive) {
        setActiveEvaluationId('rewards');
      } else {
        setActiveEvaluationId(proposal.currentEvaluationId);
      }
    }
  }, [proposal?.currentEvaluationId, isRewardsActive, setActiveEvaluationId]);

  return (
    <div>
      <Box mb={1}>
        <WorkflowSelect value={proposal?.workflowId} readOnly />
      </Box>
      <Accordion>
        <AccordionSummary sx={{ px: 1 }} hideExpand>
          <Box display='flex' alignItems='center' gap={1}>
            <StepperIcon
              result={proposal?.currentEvaluationId ? 'pass' : null}
              isCurrent={!proposal?.currentEvaluationId}
              position={1}
            />
            <Typography variant='h6'>Draft</Typography>
          </Box>
        </AccordionSummary>
        {/* <AccordionDetails sx={{ px: 1 }}></AccordionDetails> */}
      </Accordion>
      {proposal?.evaluations.map((evaluation, index) => (
        <Accordion
          key={evaluation.id}
          expanded={evaluation.id === activeEvaluationId}
          onChange={(e, expand) => setActiveEvaluationId(expand ? evaluation.id : undefined)}
        >
          <AccordionSummary sx={{ px: 1 }}>
            <Box display='flex' alignItems='center' gap={1}>
              <StepperIcon
                result={evaluation.result}
                isCurrent={evaluation.id === proposal?.currentEvaluationId && !isRewardsActive}
                position={index + 2}
              />
              <Typography variant='h6'>{evaluation.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1 }}>
            {evaluation?.type === 'feedback' && (
              <FeedbackEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
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
                isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
                isReviewer={proposal?.permissions.evaluate}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation?.type === 'rubric' && (
              <RubricEvaluation
                key={evaluation.id}
                proposal={proposal}
                isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
                evaluation={evaluation}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation?.type === 'vote' && (
              <VoteEvaluation
                key={evaluation.id}
                pageId={pageId!}
                proposal={proposal}
                isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
                evaluation={evaluation}
              />
            )}
          </AccordionDetails>
        </Accordion>
      ))}
      {hasRewardsStep && (
        <Accordion
          expanded={activeEvaluationId === 'rewards'}
          onChange={(e, expand) => setActiveEvaluationId(expand ? 'rewards' : undefined)}
        >
          <AccordionSummary sx={{ px: 1 }}>
            <Box display='flex' alignItems='center' gap={1}>
              <StepperIcon
                result={isRewardsComplete ? 'pass' : null}
                isCurrent={isRewardsActive}
                position={proposal ? proposal.evaluations.length + 2 : 0}
              />
              <Typography variant='h6'>{rewardsTitle}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1 }}>
            <PublishRewardsButton
              disabled={!(proposal?.permissions.evaluate && isRewardsActive && !isRewardsComplete)}
              proposalId={proposal?.id}
              pendingRewards={pendingRewards}
              rewardIds={proposal?.rewardIds}
              onSubmit={refreshProposal}
            />
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
}

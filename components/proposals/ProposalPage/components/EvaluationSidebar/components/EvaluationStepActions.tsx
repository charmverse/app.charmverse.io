import { Button } from 'components/common/Button';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

import { GoBackButton } from './GoBackButton';

type Props = {
  proposalId?: string;
  permissions?: any;
  evaluation?: ProposalEvaluationValues;
  isPreviousStep: boolean;
  refreshProposal?: VoidFunction;
};

export function EvaluationStepActions({ proposalId, permissions, evaluation, isPreviousStep, refreshProposal }: Props) {
  return (
    <>
      {isPreviousStep && refreshProposal && proposalId && (
        <GoBackButton
          proposalId={proposalId}
          previousStep={evaluation}
          hasMovePermission={permissions.move}
          onSubmit={refreshProposal}
        />
      )}
      <Button size='small' variant='outlined' color='secondary'>
        Go Back
      </Button>
    </>
  );
}

import { memo } from 'react';

import type { Props as EvaluationsReviewProps } from './components/Review/EvaluationsReview';
import { EvaluationsReview } from './components/Review/EvaluationsReview';
import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';
import type { Props as ProposalSettingsProps } from './components/Settings/EvaluationsSettings';

export type ProposalEvaluationsProps = {
  pageId?: string;
  isUnpublishedProposal: boolean;
  readOnlyProposalPermissions?: boolean;
  proposal?: EvaluationsReviewProps['proposal'];
  proposalInput?: ProposalSettingsProps['proposal'];
  onChangeEvaluation: ProposalSettingsProps['onChangeEvaluation'];
  onChangeWorkflow: ProposalSettingsProps['onChangeWorkflow'];
  refreshProposal?: VoidFunction;
  isReviewer?: boolean; // TODO: we need to know the reviewer for each step instead
  pagePath?: string;
  pageTitle?: string;
  templateId?: string | null;
};

// display evaluation steps or their settings, depending if a proposal is published or not
export function ProposalEvaluations({
  pageId,
  readOnlyProposalPermissions,
  proposal,
  proposalInput,
  onChangeEvaluation,
  onChangeWorkflow,
  refreshProposal,
  isReviewer,
  pagePath,
  pageTitle,
  isUnpublishedProposal,
  templateId
}: ProposalEvaluationsProps) {
  if (isUnpublishedProposal) {
    const isNotNewProposal = !!proposal;
    return (
      <EvaluationsSettings
        proposal={proposalInput}
        readOnly={!!readOnlyProposalPermissions}
        templateId={templateId}
        onChangeEvaluation={onChangeEvaluation}
        onChangeWorkflow={onChangeWorkflow}
        isReviewer={!!isReviewer}
        requireWorkflowChangeConfirmation={isNotNewProposal}
      />
    );
  } else {
    return (
      <EvaluationsReview
        pagePath={pagePath}
        pageTitle={pageTitle}
        pageId={pageId}
        proposal={proposal}
        onChangeEvaluation={onChangeEvaluation}
        refreshProposal={refreshProposal}
        templateId={templateId}
      />
    );
  }
}

export const ProposalSidebar = memo(ProposalEvaluations);

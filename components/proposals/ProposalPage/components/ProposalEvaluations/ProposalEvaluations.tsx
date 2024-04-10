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
  onChangeRewardSettings?: ProposalSettingsProps['onChangeRewardSettings'];
  onChangeSelectedCredentialTemplates: ProposalSettingsProps['onChangeSelectedCredentialTemplates'];
  refreshProposal?: VoidFunction;
  pagePath?: string;
  pageTitle?: string;
  templateId?: string | null;
  isProposalTemplate: boolean;
  isStructuredProposal: boolean;
  expanded?: boolean;
};

// display evaluation steps or their settings, depending if a proposal is published or not
export function ProposalEvaluations({
  pageId,
  readOnlyProposalPermissions,
  proposal,
  proposalInput,
  onChangeEvaluation,
  onChangeWorkflow,
  onChangeRewardSettings,
  refreshProposal,
  onChangeSelectedCredentialTemplates,
  pagePath,
  pageTitle,
  isUnpublishedProposal,
  templateId,
  isProposalTemplate,
  isStructuredProposal,
  expanded = true
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
        requireWorkflowChangeConfirmation={isNotNewProposal}
        expanded={expanded}
        isTemplate={isProposalTemplate}
        onChangeRewardSettings={onChangeRewardSettings}
        onChangeSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
        isStructuredProposal={!!isStructuredProposal}
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
        expanded={expanded}
      />
    );
  }
}

export const ProposalSidebar = memo(ProposalEvaluations);

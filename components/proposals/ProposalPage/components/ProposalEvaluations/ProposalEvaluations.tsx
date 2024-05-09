import { useIsAdmin } from 'hooks/useIsAdmin';

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
  onChangeTemplate: ProposalSettingsProps['onChangeTemplate'];
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
  refreshPage?: VoidFunction;
  pageLensPostLink?: string | null;
};

// display evaluation steps or their settings, depending if a proposal is published or not
export function ProposalEvaluations({
  pageId,
  readOnlyProposalPermissions,
  proposal,
  proposalInput,
  onChangeEvaluation,
  onChangeTemplate,
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
  expanded = true,
  pageLensPostLink,
  refreshPage
}: ProposalEvaluationsProps) {
  const isAdmin = useIsAdmin();

  if (isUnpublishedProposal) {
    return (
      <EvaluationsSettings
        proposal={proposalInput}
        readOnly={!!readOnlyProposalPermissions}
        templateId={templateId}
        onChangeEvaluation={onChangeEvaluation}
        onChangeTemplate={onChangeTemplate}
        onChangeWorkflow={onChangeWorkflow}
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
        pageLensPostLink={pageLensPostLink}
        onChangeEvaluation={onChangeEvaluation}
        readOnlyCredentialTemplates={!isAdmin}
        onChangeSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
        refreshProposal={refreshProposal}
        refreshPage={refreshPage}
        templateId={templateId}
        expanded={expanded}
      />
    );
  }
}

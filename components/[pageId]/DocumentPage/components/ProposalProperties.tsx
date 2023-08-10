import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';

import charmClient from 'charmClient';
import { useTasks } from 'components/nexus/hooks/useTasks';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { ProposalProperties as ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { useProposalDetails } from 'components/proposals/hooks/useProposalDetails';
import { useProposalFlowFlags } from 'components/proposals/hooks/useProposalFlowFlags';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  isTemplate: boolean;
  pagePermissions?: PagePermissionFlags;
  refreshPagePermissions?: () => void;
}

export function ProposalProperties({
  pagePermissions,
  refreshPagePermissions = () => null,
  pageId,
  proposalId,
  snapshotProposalId,
  readOnly,
  isTemplate
}: ProposalPropertiesProps) {
  const { proposal, refreshProposal } = useProposalDetails(proposalId);
  const { mutate: mutateTasks } = useTasks();
  const { user } = useUser();

  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });

  const { permissions: proposalFlowFlags, refresh: refreshProposalFlowFlags } = useProposalFlowFlags({ proposalId });
  const isAdmin = useIsAdmin();

  // further restrict readOnly if user cannot update proposal properties specifically
  const readOnlyProperties = readOnly || !(pagePermissions?.edit_content || isAdmin);
  const canAnswerRubric = proposalPermissions?.evaluate;
  const canViewRubricAnswers = proposalPermissions?.evaluate || isAdmin;
  const isFromTemplateSource = Boolean(proposal?.page?.sourceTemplateId);

  const proposalFormInputs: ProposalFormInputs = {
    categoryId: proposal?.categoryId,
    evaluationType: proposal?.evaluationType || 'vote',
    authors: proposal?.authors.map((author) => author.userId) ?? [],
    rubricCriteria: proposal?.rubricCriteria ?? [],
    reviewers:
      proposal?.reviewers.map((reviewer) => ({
        group: reviewer.roleId ? 'role' : 'user',
        id: reviewer.roleId ?? (reviewer.userId as string)
      })) ?? []
  };

  async function updateProposalStatus(newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      await Promise.all([
        refreshProposal(),
        refreshProposalFlowFlags(),
        refreshPagePermissions(),
        refreshProposalPermissions()
      ]);
      mutateTasks();
    }
  }

  async function onChangeProperties(values: ProposalFormInputs) {
    await charmClient.proposals.updateProposal({
      proposalId,
      ...values
    });
    refreshProposal();
    refreshProposalFlowFlags(); // needs to run when reviewers change?
  }

  return (
    <ProposalPropertiesBase
      archived={!!proposal?.archived}
      disabledCategoryInput={!proposalPermissions?.edit}
      isTemplate={isTemplate}
      proposalFlowFlags={proposalFlowFlags}
      proposalStatus={proposal?.status}
      proposalId={proposal?.id}
      pageId={pageId}
      readOnlyAuthors={readOnlyProperties}
      readOnlyRubricCriteria={readOnlyProperties || isFromTemplateSource}
      readOnlyProposalType={
        readOnlyProperties ||
        // dont let users change type after status moves to Feedback, and forward
        (proposal?.status !== 'draft' && !isTemplate) ||
        isFromTemplateSource
      }
      readOnlyReviewers={readOnlyProperties || isFromTemplateSource}
      rubricAnswers={proposal?.rubricAnswers}
      rubricCriteria={proposal?.rubricCriteria}
      userId={user?.id}
      snapshotProposalId={snapshotProposalId}
      updateProposalStatus={updateProposalStatus}
      proposalFormInputs={proposalFormInputs}
      setProposalFormInputs={onChangeProperties}
      canAnswerRubric={canAnswerRubric}
      canViewRubricAnswers={canViewRubricAnswers}
    />
  );
}

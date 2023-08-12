import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import { debounce } from 'lodash';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import {
  useUpsertRubricCriteria,
  useGetAllReviewerUserIds,
  useGetProposalFlowFlags,
  useGetProposalDetails
} from 'charmClient/hooks/proposals';
import { useTasks } from 'components/nexus/hooks/useTasks';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { ProposalProperties as ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalProperties';
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
  title?: string;
}

export function ProposalProperties({
  pagePermissions,
  refreshPagePermissions = () => null,
  pageId,
  proposalId,
  snapshotProposalId,
  readOnly,
  isTemplate,
  title
}: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { mutate: mutateTasks } = useTasks();
  const { user } = useUser();

  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });

  const { data: reviewerUserIds } = useGetAllReviewerUserIds(
    !!pageId && proposal?.evaluationType === 'rubric' ? pageId : undefined
  );
  const { data: proposalFlowFlags, mutate: refreshProposalFlowFlags } = useGetProposalFlowFlags(proposalId);
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });
  const isAdmin = useIsAdmin();

  // further restrict readOnly if user cannot update proposal properties specifically
  const readOnlyProperties = readOnly || !(pagePermissions?.edit_content || isAdmin);
  const canAnswerRubric = proposalPermissions?.evaluate;
  const canViewRubricAnswers = isAdmin || !!(user?.id && reviewerUserIds?.includes(user.id));
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

  async function onChangeRubricCriteriaAnswer() {
    refreshProposal();
  }

  async function onChangeRubricCriteria(rubricCriteria: ProposalFormInputs['rubricCriteria']) {
    // @ts-ignore TODO: unify types for rubricCriteria
    await upsertRubricCriteria({ rubricCriteria });
    if (proposal?.status === 'evaluation_active') {
      refreshProposal();
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

  const onChangeRubricCriteriaDebounced = useCallback(debounce(onChangeRubricCriteria, 300), [proposal?.status]);

  return (
    <ProposalPropertiesBase
      archived={!!proposal?.archived}
      disabledCategoryInput={!proposalPermissions?.edit}
      proposalFlowFlags={proposalFlowFlags}
      proposalStatus={proposal?.status}
      proposalId={proposal?.id}
      pageId={pageId}
      readOnlyAuthors={readOnlyProperties}
      readOnlyRubricCriteria={readOnlyProperties || isFromTemplateSource}
      readOnlyProposalEvaluationType={
        readOnlyProperties ||
        // dont let users change type after status moves to Feedback, and forward
        (proposal?.status !== 'draft' && !isTemplate) ||
        isFromTemplateSource
      }
      readOnlyReviewers={
        readOnlyProperties || (isFromTemplateSource && proposal?.reviewers && proposal.reviewers.length > 0)
      }
      rubricAnswers={proposal?.rubricAnswers}
      rubricCriteria={proposal?.rubricCriteria}
      showStatus={!isTemplate}
      userId={user?.id}
      snapshotProposalId={snapshotProposalId}
      updateProposalStatus={updateProposalStatus}
      onChangeRubricCriteriaAnswer={onChangeRubricCriteriaAnswer}
      onChangeRubricCriteria={onChangeRubricCriteriaDebounced}
      proposalFormInputs={proposalFormInputs}
      setProposalFormInputs={onChangeProperties}
      canAnswerRubric={canAnswerRubric}
      canViewRubricAnswers={canViewRubricAnswers}
      title={title || ''}
    />
  );
}

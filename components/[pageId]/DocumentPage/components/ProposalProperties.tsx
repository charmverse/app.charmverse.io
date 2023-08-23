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
import type { ProposalPropertiesInput } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { ProposalProperties as ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useLensProfile } from 'components/settings/LensProfileProvider';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  isTemplate: boolean;
  pagePermissions?: PagePermissionFlags;
  refreshPagePermissions?: () => void;
  title?: string;
  proposalPage: PageWithContent;
}

export function ProposalProperties({
  pagePermissions,
  refreshPagePermissions = () => null,
  pageId,
  proposalId,
  snapshotProposalId,
  readOnly,
  isTemplate,
  title,
  proposalPage
}: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { mutate: mutateTasks } = useTasks();
  const { user } = useUser();
  const { createPost } = useLensProfile();
  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });

  const { proposalTemplates } = useProposalTemplates({ load: !!proposal?.page?.sourceTemplateId });

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

  const proposalFormInputs: ProposalPropertiesInput = {
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
      if (newStatus === 'discussion' && proposalPage) {
        await createPost(proposalPage);
      }
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

  async function onChangeRubricCriteria(rubricCriteria: ProposalPropertiesInput['rubricCriteria']) {
    // @ts-ignore TODO: unify types for rubricCriteria
    await upsertRubricCriteria({ rubricCriteria });
    if (proposal?.status === 'evaluation_active') {
      refreshProposal();
    }
  }

  async function onChangeProperties(values: Partial<ProposalPropertiesInput>) {
    if (proposal) {
      await charmClient.proposals.updateProposal({
        proposalId,
        authors: proposal.authors.map(({ userId }) => userId),
        reviewers: proposal.reviewers.map((reviewer) => ({
          id: reviewer.roleId ?? (reviewer.userId as string),
          group: reviewer.roleId ? 'role' : 'user'
        })),
        ...values
      });
    }
    refreshProposal();
    refreshProposalFlowFlags(); // needs to run when reviewers change?
  }

  const onChangeRubricCriteriaDebounced = useCallback(debounce(onChangeRubricCriteria, 300), [proposal?.status]);

  const readOnlyReviewers =
    readOnlyProperties ||
    (isFromTemplateSource &&
      !!proposalTemplates?.find((t) => t.id === proposal?.page?.sourceTemplateId && t.reviewers.length > 0));

  return (
    <ProposalPropertiesBase
      proposalPage={proposalPage}
      archived={!!proposal?.archived}
      disabledCategoryInput={!proposalPermissions?.edit || !!proposal?.page?.sourceTemplateId}
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
      readOnlyReviewers={readOnlyReviewers}
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

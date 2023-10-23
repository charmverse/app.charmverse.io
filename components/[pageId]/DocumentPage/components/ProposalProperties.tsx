import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import { debounce } from 'lodash';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import {
  useUpsertRubricCriteria,
  useGetAllReviewerUserIds,
  useGetProposalFlowFlags,
  useGetProposalDetails
} from 'charmClient/hooks/proposals';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import type { ProposalPropertiesInput } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { ProposalProperties as ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useLensPublication } from 'components/settings/account/hooks/useLensPublication';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

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
  const { mutate: mutateNotifications } = useNotifications();
  const { user } = useUser();
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { createLensPost } = useLensPublication({
    proposalId,
    proposalPath: proposalPage.path,
    proposalTitle: proposalPage.title
  });
  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });
  const { mutateProposals } = useProposals();

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
  const sourceTemplate = isFromTemplateSource
    ? proposalTemplates?.find((template) => template.id === proposal?.page?.sourceTemplateId)
    : undefined;

  // properties with values from templates should be read only
  const readOnlyCustomProperties =
    !isAdmin && sourceTemplate?.fields
      ? Object.entries((sourceTemplate?.fields as ProposalFields).properties)?.reduce((acc, [key, value]) => {
          if (!value) {
            return acc;
          }

          acc.push(key);
          return acc;
        }, [] as string[])
      : [];

  const proposalFormInputs: ProposalPropertiesInput = {
    categoryId: proposal?.categoryId,
    evaluationType: proposal?.evaluationType || 'vote',
    authors: proposal?.authors.map((author) => author.userId) ?? [],
    rubricCriteria: proposal?.rubricCriteria ?? [],
    publishToLens: proposal ? proposal.publishToLens ?? false : !!user?.publishToLensDefault,
    reviewers:
      proposal?.reviewers.map((reviewer) => ({
        group: reviewer.roleId ? 'role' : 'user',
        id: reviewer.roleId ?? (reviewer.userId as string)
      })) ?? [],
    fields:
      typeof proposal?.fields === 'object' && !!proposal?.fields
        ? (proposal.fields as ProposalFields)
        : { properties: {} }
  };

  async function updateProposalStatus(newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      // If proposal is being published for the first time and publish to lens is enabled, create a lens post
      if (newStatus === 'discussion' && proposalPage && proposal.publishToLens && !proposal.lensPostLink) {
        setIsPublishingToLens(true);
        await createLensPost({
          proposalContent: proposalPage.content as PageContent
        });
        setIsPublishingToLens(false);
      }
      await Promise.all([
        refreshProposal(),
        refreshProposalFlowFlags(),
        refreshPagePermissions(),
        refreshProposalPermissions()
      ]);
      mutateNotifications();
      mutateProposals();
    }
  }

  function onSaveRubricCriteriaAnswers() {
    return refreshProposal();
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
    mutateProposals();
  }

  const onChangeRubricCriteriaDebounced = useCallback(debounce(onChangeRubricCriteria, 300), [proposal?.status]);
  const readOnlyCategory = !isAdmin && (!proposalPermissions?.edit || !!proposal?.page?.sourceTemplateId);
  const readOnlyReviewers =
    readOnlyProperties ||
    (!isAdmin && !!proposalTemplates?.some((t) => t.id === proposal?.page?.sourceTemplateId && t.reviewers.length > 0));

  return (
    <ProposalPropertiesBase
      proposalLensLink={proposal?.lensPostLink ?? undefined}
      archived={!!proposal?.archived}
      isFromTemplate={!!proposal?.page?.sourceTemplateId}
      proposalFlowFlags={proposalFlowFlags}
      proposalStatus={proposal?.status}
      proposalId={proposal?.id}
      pageId={pageId}
      readOnlyAuthors={readOnlyProperties}
      readOnlyCategory={readOnlyCategory}
      isAdmin={isAdmin}
      readOnlyRubricCriteria={readOnlyProperties || isFromTemplateSource}
      readOnlyProposalEvaluationType={
        readOnlyProperties ||
        // dont let users change type after status moves to Feedback, and forward
        (proposal?.status !== 'draft' && !isTemplate) ||
        isFromTemplateSource
      }
      readOnlyReviewers={readOnlyReviewers}
      rubricAnswers={proposal?.rubricAnswers}
      draftRubricAnswers={proposal?.draftRubricAnswers}
      rubricCriteria={proposal?.rubricCriteria}
      showStatus={!isTemplate}
      userId={user?.id}
      snapshotProposalId={snapshotProposalId}
      updateProposalStatus={updateProposalStatus}
      onSaveRubricCriteriaAnswers={onSaveRubricCriteriaAnswers}
      onChangeRubricCriteria={onChangeRubricCriteriaDebounced}
      proposalFormInputs={proposalFormInputs}
      setProposalFormInputs={onChangeProperties}
      canAnswerRubric={canAnswerRubric}
      canViewRubricAnswers={canViewRubricAnswers}
      title={title || ''}
      isPublishingToLens={isPublishingToLens}
      readOnlyCustomProperties={readOnlyCustomProperties}
    />
  );
}

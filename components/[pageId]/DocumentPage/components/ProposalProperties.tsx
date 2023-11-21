import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

import charmClient from 'charmClient';
import {
  useGetAllReviewerUserIds,
  useGetProposalDetails,
  useGetProposalFlowFlags,
  useUpsertRubricCriteria
} from 'charmClient/hooks/proposals';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import type { ProposalPropertiesInput } from 'components/proposals/components/ProposalProperties/ProposalPropertiesBase';
import { ProposalPropertiesBase } from 'components/proposals/components/ProposalProperties/ProposalPropertiesBase';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { PageWithContent } from 'lib/pages';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { CreateLensPublication } from './CreateLensPublication';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  enableSidebar?: boolean;
  pageId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  pagePermissions?: PagePermissionFlags;
  refreshPagePermissions?: () => void;
  openEvaluation?: () => void;
  proposalPage: PageWithContent;
}

export function ProposalProperties({
  enableSidebar,
  pagePermissions,
  refreshPagePermissions = () => null,
  pageId,
  proposalId,
  snapshotProposalId,
  readOnly,
  openEvaluation,
  proposalPage
}: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { mutate: mutateNotifications } = useNotifications();
  const { user } = useUser();
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { permissions: proposalPermissions, refresh: refreshProposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });
  const { setupLensProfile } = useLensProfile();
  const { mutateProposals } = useProposals();
  const { account } = useWeb3Account();

  const { proposalTemplates } = useProposalTemplates({ load: !!proposal?.page?.sourceTemplateId });

  const { data: reviewerUserIds } = useGetAllReviewerUserIds(
    !!pageId && proposal?.evaluationType === 'rubric' ? pageId : undefined
  );
  const { data: proposalFlowFlags, mutate: refreshProposalFlowFlags } = useGetProposalFlowFlags(proposalId);
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });
  const isAdmin = useIsAdmin();

  // further restrict readOnly if user cannot update proposal properties specifically
  const readOnlyProperties = readOnly || !(pagePermissions?.edit_content || isAdmin);
  const isReviewer = !!(user?.id && reviewerUserIds?.includes(user.id));
  const isFromTemplateSource = Boolean(proposal?.page?.sourceTemplateId);
  const isTemplate = proposalPage.type === 'proposal_template';
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
    type: proposalPage.type,
    fields:
      typeof proposal?.fields === 'object' && !!proposal?.fields
        ? (proposal.fields as ProposalFields)
        : { properties: {} }
  };

  async function updateProposalStatus(newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      if (account && newStatus === 'discussion' && proposalPage && !proposal.lensPostLink && proposal.publishToLens) {
        const lensProfileSetup = await setupLensProfile();
        if (lensProfileSetup) {
          setIsPublishingToLens(true);
        }
      }
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
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

  async function onChangeRubricCriteria(rubricCriteria: ProposalPropertiesInput['rubricCriteria']) {
    // @ts-ignore TODO: unify types for rubricCriteria
    await upsertRubricCriteria({ rubricCriteria });
    refreshProposal();
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
  const readOnlyReviewers = readOnlyProperties || (!isAdmin && sourceTemplate && sourceTemplate.reviewers.length > 0);
  // rubric criteria can always be updated by reviewers and admins
  const readOnlyRubricCriteria = (readOnlyProperties || isFromTemplateSource) && !(isAdmin || isReviewer);

  const canSeeEvaluation =
    (proposal?.status === 'evaluation_active' || proposal?.status === 'evaluation_closed') && isReviewer;

  // open the rubric sidebar by default
  useEffect(() => {
    if (enableSidebar) {
      openEvaluation?.();
    }
  }, [canSeeEvaluation]);

  return (
    <>
      <ProposalPropertiesBase
        canSeeEvaluation={canSeeEvaluation}
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
        readOnlyRubricCriteria={readOnlyRubricCriteria}
        readOnlyProposalEvaluationType={
          readOnlyProperties ||
          // dont let users change type after status moves to Feedback, and forward
          (proposal?.status !== 'draft' && !isTemplate) ||
          isFromTemplateSource
        }
        readOnlyReviewers={readOnlyReviewers}
        rubricAnswers={proposal?.rubricAnswers}
        isTemplate={isTemplate}
        rubricCriteria={proposal?.rubricCriteria}
        snapshotProposalId={snapshotProposalId}
        updateProposalStatus={updateProposalStatus}
        onChangeRubricCriteria={onChangeRubricCriteriaDebounced}
        proposalFormInputs={proposalFormInputs}
        setProposalFormInputs={onChangeProperties}
        isPublishingToLens={isPublishingToLens}
        readOnlyCustomProperties={readOnlyCustomProperties}
        openEvaluation={openEvaluation}
      />
      {isPublishingToLens && (
        <CreateLensPublication
          onError={() => {
            setIsPublishingToLens(false);
          }}
          publicationType='post'
          content={proposalPage.content as PageContent}
          proposalId={proposalId}
          proposalPath={proposalPage.path}
          onSuccess={async () => {
            await refreshProposal();
            setIsPublishingToLens(false);
          }}
          proposalTitle={proposalPage.title}
        />
      )}
    </>
  );
}

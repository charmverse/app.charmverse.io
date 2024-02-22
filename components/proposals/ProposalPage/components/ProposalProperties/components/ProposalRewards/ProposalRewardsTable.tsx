import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Box, Stack, Typography } from '@mui/material';
import { uniqBy } from 'lodash';
import { useMemo, useState } from 'react';
import { v4 } from 'uuid';

import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { InlineDatabaseContainer } from 'components/common/CharmEditor/components/inlineDatabase/components/InlineDatabaseContainer';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { DatabaseStickyHeader } from 'components/common/PageLayout/components/DatabasePageContent';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import type { BoardReward } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { mapRewardToCardPage } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { CardPage } from 'lib/focalboard/card';
import type { PagesMap } from 'lib/pages';
import type { ProposalPendingReward } from 'lib/proposal/interface';
import { getProposalRewardsView } from 'lib/rewards/blocks/views';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardWithUsers, RewardType, RewardReviewer } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { AttachRewardButton } from './AttachRewardButton';

type Props = {
  containerWidth: number;
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds: string[];
  readOnly?: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  assignedSubmitters: string[];
  requiredTemplateId?: string | null;
  variant?: 'solid_button' | 'card_property'; // solid_button is used for form proposals
  isProposalTemplate?: boolean;
};

const rewardQueryKey = 'rewardId';
export function ProposalRewardsTable({
  containerWidth,
  pendingRewards,
  readOnly,
  onSave,
  onDelete,
  rewardIds,
  reviewers,
  assignedSubmitters,
  requiredTemplateId,
  variant,
  isProposalTemplate
}: Props) {
  const { space } = useCurrentSpace();
  const { boardBlock, isLoading } = useRewardsBoard();

  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { rewards: allRewards } = useRewards();
  const { pages, loadingPages } = usePages();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

  const { getFeatureTitle } = useSpaceFeatures();
  const {
    updateURLQuery,
    navigateToSpacePath,
    router: { query }
  } = useCharmRouter();

  useRewardsNavigation(rewardQueryKey);

  const publishedRewards = (rewardIds || []).map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy);
  const canCreatePendingRewards = !readOnly && !publishedRewards.length;

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
    setCurrentPendingId(null);
  }

  async function saveForm() {
    if (newPageValues) {
      onSave({ reward: rewardValues, page: newPageValues, draftId: currentPendingId || '' });
      closeDialog();
    }
  }

  function createNewReward() {
    clearRewardValues();
    const template = templates?.find((t) => t.page.id === requiredTemplateId);
    // use reviewers from the proposal if not set in the template
    const rewardReviewers = template?.reward.reviewers?.length
      ? template.reward.reviewers
      : uniqBy(
          reviewers
            .map((reviewer) =>
              reviewer.roleId
                ? { group: 'role', id: reviewer.roleId }
                : reviewer.userId
                ? { group: 'user', id: reviewer.userId }
                : null
            )
            .filter(isTruthy) as RewardReviewer[],
          'id'
        );
    const rewardAssignedSubmitters = template?.reward.allowedSubmitterRoles?.length
      ? template.reward.allowedSubmitterRoles
      : assignedSubmitters;

    setRewardValues(
      { ...template?.reward, reviewers: rewardReviewers, assignedSubmitters: rewardAssignedSubmitters },
      { skipDirty: true }
    );

    openNewPage({
      ...template?.page,
      content: template?.page.content as any,
      templateId: requiredTemplateId || undefined,
      title: undefined,
      type: 'bounty'
    });
    // set a new draftId
    setCurrentPendingId(v4());
  }

  function showRewardCard(id: string | null) {
    const isPublished = publishedRewards.some((r) => r.id === id);
    if (id && isPublished) {
      openPublishedReward(id);
    } else {
      const pending = pendingRewards?.find((r) => r.draftId === id);
      if (pending) {
        setRewardValues(pending.reward);
        openNewPage(pending.page);
        setCurrentPendingId(id);
      }
    }
  }

  function openPublishedReward(pageId: string) {
    // const modalView = !!query.id;

    // if (!modalView) {
    //   navigateToSpacePath(`/${pageId}`);
    //   return;
    // }

    updateURLQuery({ [rewardQueryKey]: pageId });
  }

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      setRewardValues(template.reward);
      updateNewPageValues({
        ...template.page,
        content: template.page.content as any,
        title: undefined,
        type: 'bounty',
        templateId: template.page.id
      });
    } else {
      updateNewPageValues({
        templateId: undefined
      });
    }
  }

  const newRewardErrors = getRewardErrors({
    page: newPageValues,
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    isProposalTemplate
  }).join(', ');

  const cardPages = useMemo(
    () =>
      publishedRewards.length > 0
        ? getCardsFromPublishedRewards(publishedRewards, pages)
        : getCardsFromPendingRewards(pendingRewards || [], space?.id),
    [pendingRewards, space?.id, pages]
  );

  const rewardTypes = useMemo(() => {
    const typesSet = (pendingRewards || []).reduce<Set<RewardType>>((acc, page) => {
      const rewardType = getRewardType(page.reward);
      if (rewardType) {
        acc.add(rewardType);
      }
      return acc;
    }, new Set());
    return [...typesSet];
  }, [pendingRewards]);

  const tableView = useMemo(
    () => getProposalRewardsView({ board: boardBlock, spaceId: space?.id, rewardTypes }),
    [space?.id, boardBlock, rewardTypes]
  );

  const loadingData = isLoading;

  return (
    <>
      <InlineDatabaseContainer className='focalboard-body' containerWidth={containerWidth}>
        <div className='BoardComponent drag-area-container'>
          <DatabaseStickyHeader>
            <Box display={cardPages.length ? 'flex' : 'block'} justifyContent='space-between' alignItems='center'>
              <Box my={1}>
                <Typography variant='h5'>{getFeatureTitle('Rewards')}</Typography>
              </Box>
              <Box my={1}>
                {canCreatePendingRewards && !loadingData && (
                  <AttachRewardButton createNewReward={createNewReward} variant={variant} />
                )}
              </Box>
            </Box>
          </DatabaseStickyHeader>
          {loadingData ? (
            <LoadingComponent height={500} isLoading />
          ) : cardPages.length ? (
            <Box className='container-container'>
              <Stack>
                <Box width='100%'>
                  <Table
                    boardType='rewards'
                    hideCalculations
                    setSelectedPropertyId={() => {}}
                    board={boardBlock!}
                    activeView={tableView}
                    cardPages={cardPages}
                    views={[]}
                    visibleGroups={[]}
                    selectedCardIds={[]}
                    readOnly={true}
                    disableAddingCards
                    showCard={showRewardCard}
                    readOnlyTitle
                    readOnlyRows
                    cardIdToFocusOnRender=''
                    addCard={async () => {}}
                    onCardClicked={() => {}}
                    onDeleteCard={async (cardId) => onDelete(cardId)}
                  />
                </Box>
              </Stack>
            </Box>
          ) : null}
        </div>
      </InlineDatabaseContainer>
      <NewPageDialog
        contentUpdated={!readOnly && (contentUpdated || isDirty)}
        disabledTooltip={newRewardErrors}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        onCancel={closeDialog}
        isSaving={isSavingReward}
      >
        <NewDocumentPage
          key={newPageValues?.templateId}
          titlePlaceholder={`${getFeatureTitle('Reward')} title (required)`}
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            readOnly={readOnly}
            isTemplate={false}
            expandedByDefault
            forcedApplicationType='assigned'
            templateId={newPageValues?.templateId}
            readOnlyTemplate={!!requiredTemplateId}
            selectTemplate={selectTemplate}
            isProposalTemplate={isProposalTemplate}
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}

function getCardsFromPendingRewards(pendingRewards: ProposalPendingReward[], spaceId?: string): CardPage[] {
  return pendingRewards.map(({ reward, page, draftId }) => {
    return mapRewardToCardPage({
      spaceId: spaceId || '',
      reward: {
        // add fields to satisfy PageMeta type. TODO: We dont need all fields on PageMeta for cards
        // applications: [], // dont pass in applications or the expanded arrow icons will appear in tableRow
        assignedSubmitters: [],
        allowMultipleApplications: false,
        allowedSubmitterRoles: [],
        approveSubmitters: false,
        chainId: null,
        createdAt: new Date(),
        createdBy: '',
        customReward: null,
        fields: { properties: {} },
        dueDate: null,
        id: draftId,
        maxSubmissions: null,
        proposalId: null,
        reviewers: [],
        rewardAmount: null,
        rewardToken: null,
        spaceId: '',
        status: 'open',
        submissionsLocked: false,
        suggestedBy: null,
        updatedAt: new Date(),
        ...reward
      } as BoardReward,
      rewardPage: {
        id: draftId,
        // add fields to satisfy PageMeta type. TODO: We dont need all fields on PageMeta for cards
        boardId: null,
        bountyId: null,
        createdAt: new Date(),
        createdBy: '',
        deletedAt: null,
        deletedBy: null,
        hasContent: false,
        headerImage: '',
        icon: null,
        type: 'bounty',
        galleryImage: '',
        syncWithPageId: null,
        index: 0,
        cardId: null,
        path: '',
        parentId: null,
        sourceTemplateId: null,
        proposalId: null,
        spaceId: '',
        title: '',
        updatedAt: new Date(),
        updatedBy: '',
        ...page
      }
    });
  });
}

function getCardsFromPublishedRewards(rewards: RewardWithUsers[], pages: PagesMap): CardPage[] {
  return (
    rewards
      // dont pass in applications or the expanded arrow icons will appear in tableRow
      .map(({ applications, ...reward }) => {
        const page = pages[reward.id];
        if (!page) {
          return null;
        }
        return mapRewardToCardPage({
          spaceId: page.spaceId,
          reward: {
            ...reward,
            fields: reward.fields as any
          } as BoardReward,
          rewardPage: page
        });
      })
      .filter(isTruthy)
  );
}

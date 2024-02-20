import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { uniqBy } from 'lodash';
import { useState } from 'react';
import { v4 } from 'uuid';

import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { Button } from 'components/common/Button';
import { StylesContainer } from 'components/common/CharmEditor/components/inlineDatabase/components/InlineDatabase';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { DatabaseStickyHeader } from 'components/common/PageLayout/components/DatabasePageContent';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import { mapRewardToCardPage } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposal/interface';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { AttachRewardButton, getDisabledTooltip } from './AttachRewardButton';

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
  const { defaultView, boardBlock, isLoading } = useRewardsBoard();
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { rewards: allRewards } = useRewards();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

  const { getFeatureTitle } = useSpaceFeatures();
  const {
    updateURLQuery,
    navigateToSpacePath,
    router: { query }
  } = useCharmRouter();

  useRewardsNavigation(rewardQueryKey);

  const publishedRewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];
  const canCreatePendingRewards = !readOnly && !rewardIds?.length;

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

  const cardPages = (pendingRewards || [])?.map(({ reward, page, draftId }) => {
    return mapRewardToCardPage({
      spaceId: space?.id || '',
      reward: {
        // add fields to satisfy PageMeta type. TODO: We dont need all fields on PageMeta for cards
        applications: [],
        assignedSubmitters: [],
        allowMultipleApplications: false,
        allowedSubmitterRoles: [],
        approveSubmitters: false,
        chainId: null,
        createdAt: new Date(),
        createdBy: '',
        customReward: null,
        fields: {},
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
      },
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

  const loadingData = isLoading;

  return (
    <>
      <StylesContainer className='focalboard-body' containerWidth={containerWidth}>
        <div className='BoardComponent drag-area-container'>
          <DatabaseStickyHeader>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Box my={1}>
                <Typography variant='h5'>{getFeatureTitle('Rewards')}</Typography>
              </Box>
              <div>
                {canCreatePendingRewards && <AttachRewardButton createNewReward={createNewReward} variant={variant} />}
              </div>
            </Box>
          </DatabaseStickyHeader>
          {loadingData ? (
            <Grid item xs={12} sx={{ mt: 12 }}>
              <LoadingComponent height={500} isLoading size={50} />
            </Grid>
          ) : (
            <Box className='container-container'>
              <Stack>
                <Box width='100%'>
                  <Table
                    boardType='rewards'
                    setSelectedPropertyId={() => {}}
                    board={boardBlock!}
                    activeView={defaultView}
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
                    onDeleteCard={() => Promise.resolve()}
                  />
                </Box>
              </Stack>
            </Box>
          )}
        </div>
      </StylesContainer>
      <NewPageDialog
        contentUpdated={!readOnly && (contentUpdated || isDirty)}
        disabledTooltip={getDisabledTooltip({
          readOnly,
          newPageValues,
          rewardValues,
          isProposalTemplate: !!isProposalTemplate
        })}
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

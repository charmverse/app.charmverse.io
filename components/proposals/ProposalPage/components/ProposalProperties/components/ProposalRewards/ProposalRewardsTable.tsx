import type { ProposalReviewer } from '@charmverse/core/prisma';
import { DeleteOutlineOutlined as TrashIcon } from '@mui/icons-material';
import { Box, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import { uniqBy } from 'lodash';
import { useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { InlineDatabaseContainer } from 'components/common/CharmEditor/components/inlineDatabase/components/InlineDatabaseContainer';
import { ContextMenu } from 'components/common/ContextMenu';
import Table from 'components/common/DatabaseEditor/components/table/table';
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
import { mapRewardToCard } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { CardWithRelations } from 'lib/databases/card';
import type { PagesMap } from 'lib/pages';
import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { getProposalRewardsView } from 'lib/rewards/blocks/views';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer, RewardType, RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utils/types';

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
  const { navigateToSpacePath } = useCharmRouter();
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { rewards: allRewards, mutateRewards, isLoading: isLoadingRewards } = useRewards();
  const { pages, loadingPages } = usePages();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

  const { getFeatureTitle } = useSpaceFeatures();

  const tableView = useMemo(() => {
    const rewardTypesUsed = (pendingRewards || []).reduce<Set<RewardType>>((acc, page) => {
      const rewardType = getRewardType(page.reward);
      if (rewardType) {
        acc.add(rewardType);
      }
      return acc;
    }, new Set());
    return getProposalRewardsView({
      board: boardBlock,
      spaceId: space?.id,
      rewardTypes: [...rewardTypesUsed],
      includeStatus: rewardIds.length > 0
    });
  }, [space?.id, boardBlock, pendingRewards, rewardIds.length]);

  const publishedRewards = useMemo(
    () => rewardIds.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy),
    [rewardIds, allRewards]
  );
  const cards = useMemo(
    () =>
      publishedRewards.length > 0
        ? getCardsFromPublishedRewards(publishedRewards, pages)
        : getCardsFromPendingRewards(pendingRewards || [], space?.id),
    [pendingRewards, space?.id, pages, publishedRewards]
  );

  const canCreatePendingRewards = !readOnly && !publishedRewards.length;
  const newRewardErrors = getRewardErrors({
    page: newPageValues,
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    isProposalTemplate
  }).join(', ');

  const loadingData = isLoading || isLoadingRewards || loadingPages;

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

    const newReward = { ...template?.reward, reviewers: rewardReviewers, assignedSubmitters: rewardAssignedSubmitters };
    if (template?.reward) {
      (newReward as any).rewardType = getRewardType(template.reward);
    }
    setRewardValues(newReward, { skipDirty: true });

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
    navigateToSpacePath(`/${pageId}`);
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

  function deleteReward() {
    if (currentPendingId) {
      onDelete(currentPendingId);
      closeDialog();
    }
  }

  return (
    <>
      <InlineDatabaseContainer className='focalboard-body' containerWidth={containerWidth}>
        <div className='BoardComponent drag-area-container'>
          <DatabaseStickyHeader>
            <Box display={cards.length ? 'flex' : 'block'} justifyContent='space-between' alignItems='center'>
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
          ) : cards.length ? (
            <Box className='container-container'>
              <Stack>
                <Box width='100%' mb={1}>
                  <Table
                    boardType='rewards'
                    hideCalculations
                    setSelectedPropertyId={() => {}}
                    board={boardBlock!}
                    activeView={tableView}
                    cards={cards}
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
        toolbar={
          <Box display='flex' justifyContent='flex-end'>
            {currentPendingId && (
              <ContextMenu iconColor='secondary' popupId='reward-context'>
                <MenuItem color='inherit' onClick={deleteReward}>
                  <ListItemIcon>
                    <TrashIcon />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </ContextMenu>
            )}
          </Box>
        }
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

function getCardsFromPendingRewards(pendingRewards: ProposalPendingReward[], spaceId?: string): CardWithRelations[] {
  return pendingRewards.map(({ reward, page, draftId }) => {
    return mapRewardToCard({
      spaceId: spaceId || '',
      reward: {
        // applications: [], // dont pass in applications or the expanded arrow icons will appear in tableRow
        assignedSubmitters: [],
        chainId: null,
        customReward: null,
        fields: { properties: {} },
        dueDate: null,
        id: draftId,
        maxSubmissions: null,
        reviewers: [],
        rewardAmount: null,
        rewardToken: null,
        status: 'open',
        ...reward
      } as BoardReward,
      rewardPage: {
        createdAt: new Date(),
        createdBy: '',
        icon: null,
        type: 'bounty',
        path: '',
        title: '',
        updatedAt: new Date(),
        updatedBy: '',
        ...page,
        id: draftId
      }
    });
  });
}

function getCardsFromPublishedRewards(rewards: RewardWithUsers[], pages: PagesMap): CardWithRelations[] {
  return (
    rewards
      // dont pass in applications or the expanded arrow icons will appear in tableRow
      .map(({ applications, ...reward }) => {
        const page = pages[reward.id];
        if (!page) {
          return null;
        }
        return mapRewardToCard({
          spaceId: page.spaceId,
          reward: {
            ...reward,
            fields: reward.fields as any
          } as BoardReward,
          rewardPage: page
        });
      })
      .filter(isTruthy)
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
  );
}

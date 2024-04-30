import type { ProposalReviewer } from '@charmverse/core/prisma';
import { DeleteOutlineOutlined as TrashIcon } from '@mui/icons-material';
import { Box, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { InlineDatabaseContainer } from 'components/common/CharmEditor/components/inlineDatabase/components/InlineDatabaseContainer';
import { ContextMenu } from 'components/common/ContextMenu';
import Table from 'components/common/DatabaseEditor/components/table/table';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { DatabaseStickyHeader } from 'components/common/PageLayout/components/DatabasePageContent';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import type { BoardReward } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { mapRewardToCard } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { CardWithRelations } from 'lib/databases/card';
import type { PagesMap } from 'lib/pages';
import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { getProposalRewardsView } from 'lib/rewards/blocks/views';
import type { RewardType, RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utils/types';

import { useProposalRewards } from '../../hooks/useProposalRewards';

import { AttachRewardButton } from './AttachRewardButton';
import { ProposalRewardsForm } from './ProposalRewardsForm';

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
  const { rewards: allRewards, isLoading: isLoadingRewards } = useRewards();
  const { pages, loadingPages } = usePages();
  const { navigateToSpacePath } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  const {
    createNewReward,
    closeDialog,
    newRewardErrors,
    saveForm,
    selectTemplate,
    contentUpdated,
    isDirty,
    isSavingReward,
    newPageValues,
    openNewPage,
    setRewardValues,
    updateNewPageValues,
    rewardValues,
    currentPendingId,
    setCurrentPendingId
  } = useProposalRewards({
    assignedSubmitters,
    onSave,
    reviewers,
    requiredTemplateId,
    isProposalTemplate
  });

  const tableView = useMemo(() => {
    const rewardTypesUsed = (pendingRewards || []).reduce<Set<RewardType>>((acc, page) => {
      if (page.reward.rewardType) {
        acc.add(page.reward.rewardType);
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

  const loadingData = isLoading || isLoadingRewards || loadingPages;

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
          <ProposalRewardsForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            readOnly={readOnly}
            isTemplate={false}
            expandedByDefault
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

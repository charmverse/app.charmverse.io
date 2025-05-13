import type { Page } from '@charmverse/core/prisma';
import type { Theme } from '@mui/material';
import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { isTruthy } from '@packages/utils/types';
import dynamic from 'next/dynamic';
import type { EditorState } from 'prosemirror-state';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useResizeObserver } from 'usehooks-ts';

import { CharmEditor } from 'components/common/CharmEditor';
import { CardPropertiesWrapper } from 'components/common/CharmEditor/CardPropertiesWrapper';
import { handleImageFileDrop } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import type { ConnectionEvent } from 'components/common/CharmEditor/components/fiduswriter/ws';
import { focusEventName } from 'components/common/CharmEditor/constants';
import CardDetailProperties from 'components/common/DatabaseEditor/components/cardDetail/cardDetailProperties';
import { makeSelectBoard } from 'components/common/DatabaseEditor/store/boards';
import { makeSelectViewCardsSortedFilteredAndGrouped } from 'components/common/DatabaseEditor/store/cards';
import { blockLoad, databaseViewsLoad } from 'components/common/DatabaseEditor/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { makeSelectSortedViews } from 'components/common/DatabaseEditor/store/views';
import { FormFieldAnswers } from 'components/common/form/FormFieldAnswers';
import { ControlledFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import type { useProposalFormAnswers } from 'components/proposals/hooks/useProposalFormAnswers';
import type { useProposalFormFieldsEditor } from 'components/proposals/hooks/useProposalFormFieldsEditor';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalStickyFooter } from 'components/proposals/ProposalPage/components/ProposalStickyFooter/ProposalStickyFooter';
import { RewardEvaluations } from 'components/rewards/components/RewardEvaluations/RewardEvaluations';
import { RewardStickyFooter } from 'components/rewards/components/RewardStickyFooter';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages/interfaces';
import { fontClassName } from 'theme/fonts';

import { AlertContainer } from './components/AlertContainer';
import { PageComments } from './components/CommentsFooter/PageComments';
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import { PageEditorContainer } from './components/PageEditorContainer';
import PageHeader, { getPageTop } from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import { PageTitleInput } from './components/PageTitleInput';
import { ProposalBanner } from './components/ProposalBanner';
import { ProposalNotesBanner } from './components/ProposalNotesBanner';
import { ProposalProperties } from './components/ProposalProperties';
import { SyncedPageBanner } from './components/SyncedPageBanner';
import type { IPageSidebarContext } from './hooks/usePageSidebar';
import type { useProposal } from './hooks/useProposal';
import { useReward } from './hooks/useReward';

export const defaultPageTop = 56; // we need to add some room for the announcement banner and other banners

const RewardProperties = dynamic(
  () => import('components/[pageId]/DocumentPage/components/RewardProperties').then((r) => r.RewardProperties),
  { ssr: false }
);
export type ProposalProps = ReturnType<typeof useProposal> & {
  proposalAnswersProps: ReturnType<typeof useProposalFormAnswers>;
  proposalFormFieldsProps: ReturnType<typeof useProposalFormFieldsEditor>;
};

export type DocumentPageProps = {
  page: PageWithContent;
  savePage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  insideModal?: boolean;
  setEditorState?: (state: EditorState) => void;
  sidebarView?: IPageSidebarContext['activeView'];
  setSidebarView?: IPageSidebarContext['setActiveView'];
  showCard?: (cardId: string | null) => void;
  showParentChip?: boolean;
} & ProposalProps;

function DocumentPageComponent({
  insideModal = false,
  page,
  savePage,
  readOnly = false,
  setEditorState,
  sidebarView,
  setSidebarView,
  showCard,
  showParentChip,
  proposal,
  refreshProposal,
  onChangeEvaluation,
  onChangeTemplate,
  onChangeWorkflow,
  onChangeRewardSettings,
  onChangeSelectedCredentialTemplates,
  proposalAnswersProps,
  proposalFormFieldsProps
}: DocumentPageProps) {
  const { user } = useUser();
  const { router } = useCharmRouter();
  const { editMode, setPageProps, printRef: _printRef } = useCharmEditor();
  const { setView: setCharmEditorView } = useCharmEditorView();
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const isMdScreen = useMdScreen();
  const isAdmin = useIsAdmin();
  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;
  const rewardId = page.bountyId;
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const { onChangeRewardWorkflow, reward, updateReward, refreshReward } = useReward({
    rewardId
  });

  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || readOnly || !!proposal?.archived;

  const card = useAppSelector((state) => {
    if (page?.type !== 'card' && page?.type !== 'card_template' && page?.type !== 'card_synced') {
      return null;
    }
    return state.cards.cards[page.id] ?? state.cards.templates[page.id];
  });

  const selectBoard = useMemo(makeSelectBoard, []);
  const selectViewCardsSortedFilteredAndGrouped = useMemo(makeSelectViewCardsSortedFilteredAndGrouped, []);
  const selectSortedViews = useMemo(makeSelectSortedViews, []);
  const board = useAppSelector((state) => selectBoard(state, card?.parentId ?? ''));
  const boardViews = useAppSelector((state) => selectSortedViews(state, board?.id || ''));
  const currentViewId = router.query.viewId as string | undefined;
  const activeView = boardViews.find((view) => view.id === currentViewId);
  const cards = useAppSelector((state) =>
    selectViewCardsSortedFilteredAndGrouped(state, {
      boardId: board?.id || '',
      viewId: ''
    })
  );

  const showPageBanner =
    page.type !== 'proposal' &&
    page.type !== 'proposal_template' &&
    page.type !== 'proposal_notes' &&
    page.type !== 'bounty' &&
    page.type !== 'bounty_template';
  const pageTop = showPageBanner ? getPageTop(page) : defaultPageTop;

  const { threads, currentPageId: threadsPageId } = useThreads();
  const isSharedPage = router.pathname.startsWith('/share');
  // Check if we are on the rewards page, as parent chip is only shown on rewards page
  const isRewardsPage = router.pathname === '/[domain]/rewards';
  const _showParentChip =
    showParentChip ?? !!(page.type === 'card' && rewardId && card?.parentId && insideModal && isRewardsPage);

  const fontFamilyClassName = `font-family-${page.fontFamily}${page.fontSizeSmall ? ' font-size-small' : ''}`;
  const hideCardDetails = isRewardsPage && rewardId;

  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions.comment;
  const isPageTemplate = page.type.includes('template');

  const enableComments = !isSharedPage && !enableSuggestingMode && !isPageTemplate && !!pagePermissions?.comment;

  const isStructuredProposal = Boolean(proposal?.formId);
  const isUnpublishedProposal = proposal?.status === 'draft' || page.type === 'proposal_template';
  const readOnlyTitle =
    readOnly ||
    !!enableSuggestingMode ||
    !!page.syncWithPageId ||
    !!proposal?.archived ||
    page.type === 'proposal_notes';

  // create a key that updates when edit mode changes - default to 'editing' so we dont close sockets immediately
  const editorKey = page.id + (editMode || 'editing') + pagePermissions.edit_content + !!proposal?.archived;

  function onParticipantUpdate(participants: FrontendParticipant[]) {
    setPageProps({ participants });
  }

  const _showCard = useCallback(
    async (cardId: string | null) => {
      if (showCard) {
        showCard(cardId);
      } else {
        if (cardId === null) {
          updateURLQuery({ cardId: null });
          return;
        }

        if (insideModal) {
          updateURLQuery({ viewId: router.query.viewId as string, cardId });
        } else {
          navigateToSpacePath(`/${cardId}`);
        }
      }
    },
    [router.query, showCard]
  );

  function onConnectionEvent(event: ConnectionEvent) {
    if (event.type === 'error') {
      setConnectionError(event.error);
    } else if (event.type === 'subscribed') {
      // clear out error in case we re-subscribed
      setConnectionError(null);
    }
  }

  useEffect(() => {
    if (page?.type === 'card') {
      // the two properties are the title and the id which are added to the card as soon as we get the corresponding page
      const hasCardLoaded = card && Object.keys(card).length > 2;
      if (!hasCardLoaded) {
        dispatch(databaseViewsLoad({ pageId: page.parentId as string }));
        dispatch(blockLoad({ blockId: page.id }));
        dispatch(blockLoad({ blockId: page.parentId as string }));
      }
    }
  }, [page.id]);

  // reset error and sidebar state whenever page id changes
  useEffect(() => {
    setConnectionError(null);
  }, [page.id, threadsPageId]);

  const threadIds = useMemo(
    () =>
      typeof page.type === 'string'
        ? Object.values(threads)
            .filter((thread) => !thread?.resolved)
            .filter(isTruthy)
            .map((thread) => thread.id)
        : undefined,
    [threads, page.type]
  );

  // keep a ref in sync for printing
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (printRef?.current !== _printRef?.current) {
      setPageProps({
        printRef
      });
    }
  }, [printRef, _printRef]);

  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core[data-page-id="${page.id}"]`)?.dispatchEvent(focusEvent);
  }

  const proposalAuthors = proposal ? [proposal.createdBy, ...proposal.authors.map((author) => author.userId)] : [];
  return (
    <Box id='file-drop-container' display='flex' flexDirection='column' height='100%'>
      <FormProvider {...proposalAnswersProps.projectForm}>
        <Box
          ref={printRef}
          className={`document-print-container ${fontClassName} drag-area-container`}
          display='flex'
          flexDirection='column'
          flexGrow={1}
          overflow='auto'
          sx={{
            '.ProseMirror': {
              padding: '5px 0'
            }
          }}
          onDrop={handleImageFileDrop({
            pageId: page.id,
            readOnly,
            parentElementId: 'file-drop-container'
          })}
        >
          {/** we need a reference for width to handle inline dbs */}
          <Box ref={containerWidthRef} width='100%' />
          {/* show either deleted banner or archived, but not both */}
          {page.deletedAt && (
            <AlertContainer>
              <PageDeleteBanner pageType={page.type} pageId={page.id} />
            </AlertContainer>
          )}
          {connectionError && (
            <AlertContainer>
              <ConnectionErrorBanner />
            </AlertContainer>
          )}
          {page.convertedProposalId && (
            <AlertContainer>
              <ProposalBanner type='page' proposalId={page.convertedProposalId} />
            </AlertContainer>
          )}
          {(board?.fields.sourceType === 'proposals' || board?.fields.sourceType === 'rewards') && (
            <AlertContainer>
              <SyncedPageBanner pageId={page.syncWithPageId} source={board.fields.sourceType} />
            </AlertContainer>
          )}
          {page.type === 'proposal_notes' && (
            <AlertContainer>
              <ProposalNotesBanner />
            </AlertContainer>
          )}
          <PageTemplateBanner parentId={page.parentId} pageType={page.type} />
          {/* temporary? disable editing of page meta data when in suggestion mode */}
          {page.headerImage && (
            <PageBanner
              headerImage={page.headerImage}
              readOnly={readOnly || !!enableSuggestingMode}
              setPage={savePage}
            />
          )}
          <PageEditorContainer
            data-test='page-charmeditor'
            className={fontFamilyClassName}
            top={pageTop}
            fullWidth={isSmallScreen || (page.fullWidth ?? false)}
          >
            {/* temporary? disable editing of page title when in suggestion mode */}
            {showPageBanner ? (
              <PageHeader
                headerImage={page.headerImage}
                // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                key={page.id}
                icon={page.icon}
                title={page.title}
                updatedAt={page.updatedAt.toString()}
                readOnly={readOnly || !!enableSuggestingMode}
                setPage={savePage}
                readOnlyTitle={!!page.syncWithPageId}
                parentId={_showParentChip && card ? card.parentId : null}
                insideModal={insideModal}
                pageId={page.id}
                githubIssueUrl={reward?.githubIssueUrl}
                focusDocumentEditor={focusDocumentEditor}
              />
            ) : (
              <PageTitleInput
                key={page.id}
                value={page.title}
                focusDocumentEditor={focusDocumentEditor}
                updatedAt={page.updatedAt.toString()}
                onChange={(updates) => savePage(updates as { title: string; updatedAt: any })}
                readOnly={readOnlyTitle}
              />
            )}
            {(proposalId || rewardId) && (insideModal || !isMdScreen) && (
              <Tabs
                sx={{
                  mb: 1
                }}
                indicatorColor='primary'
                value={currentTab}
              >
                <Tab label='Document' value={0} onClick={() => setCurrentTab(0)} />
                <Tab
                  sx={{
                    px: 1.5,
                    fontSize: 14,
                    minHeight: 0
                    // '&.MuiTab-root': {
                    //   color: 'palette.secondary.main'
                    // }
                  }}
                  label='Evaluation'
                  value={1}
                  onClick={() => setCurrentTab(1)}
                />
              </Tabs>
            )}
            {currentTab === 1 &&
              (page.type === 'proposal_template' || page.type === 'proposal' ? (
                <ProposalEvaluations
                  pageLensPostLink={page.lensPostLink}
                  pagePath={page.path}
                  pageTitle={page.title}
                  pageId={page.id}
                  isUnpublishedProposal={isUnpublishedProposal}
                  readOnlyProposalPermissions={!proposal?.permissions.edit}
                  isProposalTemplate={page.type === 'proposal_template'}
                  isStructuredProposal={isStructuredProposal}
                  proposal={proposal}
                  proposalInput={proposal}
                  templateId={proposal?.page?.sourceTemplateId}
                  expanded
                  onChangeEvaluation={onChangeEvaluation}
                  onChangeTemplate={onChangeTemplate}
                  refreshProposal={refreshProposal}
                  refreshProposalFormAnswers={proposalAnswersProps.refreshProposalFormAnswers}
                  onChangeWorkflow={onChangeWorkflow}
                  onChangeSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
                />
              ) : page.type === 'bounty' || page.type === 'bounty_template' ? (
                <RewardEvaluations
                  isTemplate={page.type === 'bounty_template'}
                  templateId={page.sourceTemplateId}
                  isDraft={reward?.status === 'draft'}
                  reward={reward}
                  readOnly={readOnly}
                  refreshReward={refreshReward}
                  page={page}
                  rewardInput={reward}
                  expanded
                  onChangeReward={updateReward}
                  onChangeWorkflow={onChangeRewardWorkflow}
                />
              ) : null)}

            {currentTab === 0 && (
              <>
                <CardPropertiesWrapper>
                  {/* Property list */}
                  {card && board && !hideCardDetails && (
                    <CardDetailProperties
                      syncWithPageId={page.syncWithPageId}
                      board={board}
                      card={card}
                      activeView={activeView}
                      showCard={_showCard}
                      cards={cards}
                      views={boardViews}
                      readOnly={readOnly}
                      pageUpdatedAt={page.updatedAt.toString()}
                      pageUpdatedBy={page.updatedBy}
                      disableEditPropertyOption={!!board.isLocked}
                    />
                  )}
                  {proposalId && (
                    <ProposalProperties
                      pageId={page.id}
                      proposalId={proposalId}
                      readOnly={readonlyProposalProperties}
                      proposalPage={page}
                      proposal={proposal}
                      refreshProposal={refreshProposal}
                    />
                  )}
                  {reward && (
                    <RewardProperties
                      reward={reward}
                      pageId={page.id}
                      pagePath={page.path}
                      readOnly={readOnly}
                      showApplications
                      expandedRewardProperties={false}
                      templateId={page.sourceTemplateId || undefined}
                      isTemplate={page.type === 'bounty_template'}
                    />
                  )}
                </CardPropertiesWrapper>
                {proposal && proposal.formId ? (
                  page.type === 'proposal_template' ? (
                    <ControlledFormFieldsEditor
                      {...proposalFormFieldsProps}
                      evaluations={proposal.evaluations}
                      readOnly={(!isAdmin && (!user || !proposalAuthors.includes(user.id))) || !!proposal?.archived}
                    />
                  ) : (
                    <LoadingComponent isLoading={proposalAnswersProps.isLoadingAnswers}>
                      <FormFieldAnswers
                        milestoneProps={{
                          containerWidth,
                          proposalCreatedAt: new Date(page.createdAt),
                          pendingRewards: proposal.fields?.pendingRewards || [],
                          requiredTemplateId: proposal.fields?.rewardsTemplateId,
                          reviewers: proposal.evaluations.map((e) => e.reviewers.filter((r) => !r.systemRole)).flat(),
                          assignedSubmitters: proposal.authors.map((a) => a.userId),
                          readOnly: !proposal.permissions.edit_rewards,
                          rewardIds: proposal.rewardIds || [],
                          onSave: (pendingReward) => {
                            const isExisting = proposal.fields?.pendingRewards?.find(
                              (r) => r.draftId === pendingReward.draftId
                            );
                            if (!isExisting) {
                              onChangeRewardSettings({
                                pendingRewards: [...(proposal.fields?.pendingRewards || []), pendingReward]
                              });
                            } else {
                              onChangeRewardSettings({
                                pendingRewards: [...(proposal.fields?.pendingRewards || [])].map((draft) => {
                                  if (draft.draftId === pendingReward.draftId) {
                                    return pendingReward;
                                  }
                                  return draft;
                                })
                              });
                            }
                            proposalAnswersProps.refreshProposalFormAnswers();
                          },
                          onDelete: (draftId: string) => {
                            onChangeRewardSettings({
                              pendingRewards: [...(proposal.fields?.pendingRewards || [])].filter(
                                (draft) => draft.draftId !== draftId
                              )
                            });
                          }
                        }}
                        {...proposalAnswersProps}
                        disabled={!proposal.permissions.edit}
                        enableComments={proposal.permissions.comment}
                        pageId={page.id}
                        isAuthor={proposalAuthors.includes(user?.id || '')}
                        threads={threads}
                        // This is required to reinstate the form field state after the proposal is published, necessary to show the correct project id
                        key={proposal?.status === 'draft' ? 'draft' : 'published'}
                        projectId={proposal.projectId}
                        proposalId={proposal.id}
                      />
                    </LoadingComponent>
                  )
                ) : (
                  <CharmEditor
                    placeholderText={
                      (page.type === 'bounty' || page.type === 'bounty_template') && !readOnly
                        ? `Type '/' to see the list of available commands`
                        : undefined
                    }
                    key={editorKey}
                    content={page.content as PageContent}
                    readOnly={readOnly || !!page.syncWithPageId || !!proposal?.archived}
                    autoFocus={false}
                    sidebarView={sidebarView}
                    setSidebarView={setSidebarView}
                    pageId={page.id}
                    disablePageSpecificFeatures={isSharedPage}
                    enableSuggestingMode={enableSuggestingMode}
                    enableVoting={page.type !== 'proposal'}
                    enableComments={enableComments}
                    containerWidth={containerWidth}
                    pageType={page.type}
                    pagePermissions={pagePermissions ?? undefined}
                    onConnectionEvent={onConnectionEvent}
                    setEditorState={setEditorState}
                    onParticipantUpdate={onParticipantUpdate}
                    setCharmEditorView={setCharmEditorView}
                    style={{
                      // 5 lines
                      minHeight: proposalId || page?.type.includes('card') ? '150px' : 'unset'
                    }}
                    disableNestedPages={page?.type === 'proposal' || page?.type === 'proposal_template'}
                    allowClickingFooter={true}
                    threadIds={threadIds}
                  />
                )}

                {(page.type === 'proposal' || page.type === 'card' || page.type === 'card_synced') && (
                  <Box className='dont-print-me'>
                    {/* add negative margin to offset height of .charm-empty-footer */}
                    <PageComments page={page} canComment={pagePermissions.comment} />
                  </Box>
                )}
              </>
            )}
          </PageEditorContainer>
        </Box>
        {proposal?.status && (
          <ProposalStickyFooter
            page={page}
            proposal={proposal}
            formAnswersControl={proposalAnswersProps.control}
            formFields={proposalFormFieldsProps.formFields}
            isStructuredProposal={isStructuredProposal}
          />
        )}
        {(page.type === 'bounty' || page.type === 'bounty_template') && reward?.status === 'draft' && (
          <RewardStickyFooter page={page} reward={reward} refreshReward={refreshReward} />
        )}
      </FormProvider>
    </Box>
  );
}

export const DocumentPage = memo(DocumentPageComponent);

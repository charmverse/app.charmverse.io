import type { Page } from '@charmverse/core/prisma';
import type { Theme } from '@mui/material';
import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';
import dynamic from 'next/dynamic';
import type { EditorState } from 'prosemirror-state';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useResizeObserver } from 'usehooks-ts';

import { useGetProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import { useGetReward } from 'charmClient/hooks/rewards';
import { CharmEditor } from 'components/common/CharmEditor';
import { CardPropertiesWrapper } from 'components/common/CharmEditor/CardPropertiesWrapper';
import { handleImageFileDrop } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import type { ConnectionEvent } from 'components/common/CharmEditor/components/fiduswriter/ws';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { AddBountyButton } from 'components/common/DatabaseEditor/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/DatabaseEditor/components/cardDetail/cardDetailProperties';
import { makeSelectBoard } from 'components/common/DatabaseEditor/store/boards';
import { makeSelectViewCardsSortedFilteredAndGrouped } from 'components/common/DatabaseEditor/store/cards';
import { blockLoad, databaseViewsLoad } from 'components/common/DatabaseEditor/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { makeSelectSortedViews } from 'components/common/DatabaseEditor/store/views';
import { FormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalFormFieldAnswers } from 'components/proposals/ProposalPage/components/ProposalFormFieldAnswers';
import { ProposalRewardsTable } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import { ProposalStickyFooter } from 'components/proposals/ProposalPage/components/ProposalStickyFooter/ProposalStickyFooter';
import { NewInlineReward } from 'components/rewards/components/NewInlineReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useProjectForm } from 'components/settings/projects/hooks/useProjectForm';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages/interfaces';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/constants';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utils/types';
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
import { ProposalArchivedBanner } from './components/ProposalArchivedBanner';
import { ProposalBanner } from './components/ProposalBanner';
import { ProposalNotesBanner } from './components/ProposalNotesBanner';
import { ProposalProperties } from './components/ProposalProperties';
import { SyncedPageBanner } from './components/SyncedPageBanner';
import type { IPageSidebarContext } from './hooks/usePageSidebar';
import { useProposal } from './hooks/useProposal';

export const defaultPageTop = 56; // we need to add some room for the announcement banner and other banners

const RewardProperties = dynamic(
  () => import('components/[pageId]/DocumentPage/components/RewardProperties').then((r) => r.RewardProperties),
  { ssr: false }
);
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
};

function DocumentPageComponent({
  insideModal = false,
  page,
  savePage,
  readOnly = false,
  setEditorState,
  sidebarView,
  setSidebarView,
  showCard,
  showParentChip
}: DocumentPageProps) {
  const { user } = useUser();
  const { router } = useCharmRouter();
  const { editMode, setPageProps, printRef: _printRef } = useCharmEditor();
  const { setView: setCharmEditorView } = useCharmEditorView();
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const { creatingInlineReward } = useRewards();
  const isMdScreen = useMdScreen();
  const isAdmin = useIsAdmin();
  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const isCharmverseSpace = useIsCharmverseSpace();

  const {
    proposal,
    refreshProposal,
    onChangeEvaluation,
    onChangeWorkflow,
    onChangeRewardSettings,
    onChangeSelectedCredentialTemplates
  } = useProposal({
    proposalId
  });
  const { data: proposalFormFieldAnswers = [] } = useGetProposalFormFieldAnswers({
    proposalId
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
  const cards = useAppSelector((state) =>
    selectViewCardsSortedFilteredAndGrouped(state, {
      boardId: board?.id || '',
      viewId: ''
    })
  );

  const showPageBanner =
    page.type !== 'proposal' && page.type !== 'proposal_template' && page.type !== 'proposal_notes';
  const pageTop = showPageBanner ? getPageTop(page) : defaultPageTop;

  const { threads, currentPageId: threadsPageId } = useThreads();
  const isSharedPage = router.pathname.startsWith('/share');
  // Check if we are on the rewards page, as parent chip is only shown on rewards page
  const isRewardsPage = router.pathname === '/[domain]/rewards';
  const _showParentChip =
    showParentChip ?? !!(page.type === 'card' && page.bountyId && card?.parentId && insideModal && isRewardsPage);

  const { data: reward } = useGetReward({ rewardId: page.bountyId });
  const fontFamilyClassName = `font-family-${page.fontFamily}${page.fontSizeSmall ? ' font-size-small' : ''}`;
  const hideCardDetails = isRewardsPage && page.bountyId;

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
  const projectProfileField = proposal?.form?.formFields?.find((field) => field.type === 'project_profile');
  const projectId = proposal?.projectId;
  const projectFormFieldAnswer = proposalFormFieldAnswers.find((answer) => answer.fieldId === projectProfileField?.id)
    ?.value as { projectId: string; selectedMemberIds: string[] } | undefined;

  const form = useProjectForm({
    initialProjectValues: proposal?.project,
    projectId,
    selectedMemberIds: projectFormFieldAnswer?.selectedMemberIds,
    fieldConfig:
      (projectProfileField?.fieldConfig as ProjectAndMembersFieldConfig) ?? createDefaultProjectAndMembersFieldConfig()
  });

  return (
    <Box id='file-drop-container' display='flex' flexDirection='column' height='100%'>
      <FormProvider {...form}>
        <Box
          ref={printRef}
          className={`document-print-container ${fontClassName} drag-area-container`}
          display='flex'
          flexDirection='column'
          flexGrow={1}
          overflow='auto'
          onDrop={handleImageFileDrop({
            pageId: page.id,
            readOnly,
            parentElementId: 'file-drop-container'
          })}
        >
          {/** we need a reference for width to handle inline dbs */}
          <Box ref={containerWidthRef} width='100%' />
          {/* show either deleted banner or archived, but not both */}
          {page.deletedAt ? (
            <AlertContainer>
              <PageDeleteBanner pageType={page.type} pageId={page.id} />
            </AlertContainer>
          ) : (
            !!proposal?.archived && (
              <AlertContainer>
                <ProposalArchivedBanner proposalId={proposal.id} disabled={!proposal.permissions.delete} />
              </AlertContainer>
            )
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
          {board?.fields.sourceType && (
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
            {proposalId && !isMdScreen && (
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
            {currentTab === 1 && (
              <ProposalEvaluations
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
                onChangeEvaluation={onChangeEvaluation}
                refreshProposal={refreshProposal}
                onChangeWorkflow={onChangeWorkflow}
                onChangeSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
              />
            )}

            {currentTab === 0 && (
              <>
                <CardPropertiesWrapper>
                  {/* Property list */}
                  {card && board && !hideCardDetails && (
                    <>
                      <CardDetailProperties
                        syncWithPageId={page.syncWithPageId}
                        board={board}
                        card={card}
                        showCard={_showCard}
                        cards={cards}
                        views={boardViews}
                        readOnly={readOnly}
                        pageUpdatedAt={page.updatedAt.toString()}
                        pageUpdatedBy={page.updatedBy}
                      />
                      <AddBountyButton readOnly={readOnly} card={card} />
                    </>
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
                      expandedRewardProperties={!isCharmverseSpace}
                      templateId={page.sourceTemplateId || undefined}
                      isTemplate={page.type === 'bounty_template'}
                    />
                  )}
                  {creatingInlineReward && !readOnly && <NewInlineReward pageId={page.id} />}
                </CardPropertiesWrapper>
                {proposal && proposal.formId ? (
                  page.type === 'proposal_template' ? (
                    <FormFieldsEditor
                      readOnly={(!isAdmin && (!user || !proposalAuthors.includes(user.id))) || !!proposal?.archived}
                      proposalId={proposal.id}
                      formFields={proposal.form?.formFields ?? []}
                    />
                  ) : (
                    <ProposalFormFieldAnswers
                      pageId={page.id}
                      enableComments={proposal.permissions.comment}
                      proposalId={proposal.id}
                      formFields={proposal.form?.formFields ?? []}
                      readOnly={!proposal.permissions.edit}
                      threads={threads}
                      project={proposal.project}
                      isDraft={proposal?.status === 'draft'}
                    />
                  )
                ) : (
                  <CharmEditor
                    placeholderText={
                      page.type === 'bounty' || page.type === 'bounty_template'
                        ? `Describe the reward. Type '/' to see the list of available commands`
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

                {isStructuredProposal &&
                  proposal?.fields?.enableRewards &&
                  (!!proposal.fields.pendingRewards?.length || !readOnly) && (
                    <Box mt={1}>
                      <ProposalRewardsTable
                        containerWidth={containerWidth}
                        pendingRewards={proposal.fields.pendingRewards || []}
                        requiredTemplateId={proposal.fields.rewardsTemplateId}
                        reviewers={proposal.evaluations.map((e) => e.reviewers.filter((r) => !r.systemRole)).flat()}
                        assignedSubmitters={proposal.authors.map((a) => a.userId)}
                        variant='solid_button'
                        readOnly={!proposal.permissions.edit}
                        rewardIds={proposal.rewardIds || []}
                        onSave={(pendingReward) => {
                          const isExisting = proposal.fields?.pendingRewards?.find(
                            (r) => r.draftId === pendingReward.draftId
                          );
                          if (!isExisting) {
                            onChangeRewardSettings({
                              pendingRewards: [...(proposal.fields?.pendingRewards || []), pendingReward]
                            });

                            return;
                          }

                          onChangeRewardSettings({
                            pendingRewards: [...(proposal.fields?.pendingRewards || [])].map((draft) => {
                              if (draft.draftId === pendingReward.draftId) {
                                return pendingReward;
                              }
                              return draft;
                            })
                          });
                        }}
                        onDelete={(draftId: string) => {
                          onChangeRewardSettings({
                            pendingRewards: [...(proposal.fields?.pendingRewards || [])].filter(
                              (draft) => draft.draftId !== draftId
                            )
                          });
                        }}
                      />
                    </Box>
                  )}

                {(page.type === 'proposal' || page.type === 'card' || page.type === 'card_synced') && (
                  <Box>
                    {/* add negative margin to offset height of .charm-empty-footer */}
                    <PageComments page={page} enableComments={pagePermissions.comment} />
                  </Box>
                )}
              </>
            )}
          </PageEditorContainer>
        </Box>
        {(page.type === 'proposal' || page.type === 'proposal_template') && proposal?.status === 'draft' && (
          <ProposalStickyFooter page={page} proposal={proposal} isStructuredProposal={isStructuredProposal} />
        )}
      </FormProvider>
    </Box>
  );
}

export const DocumentPage = memo(DocumentPageComponent);

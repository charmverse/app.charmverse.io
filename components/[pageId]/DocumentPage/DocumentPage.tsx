import type { Page } from '@charmverse/core/prisma';
import type { Theme } from '@mui/material';
import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';
import dynamic from 'next/dynamic';
import type { EditorState } from 'prosemirror-state';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import { useGetReward } from 'charmClient/hooks/rewards';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import AddBountyButton from 'components/common/BoardEditor/focalboard/src/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { blockLoad, databaseViewsLoad } from 'components/common/BoardEditor/focalboard/src/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { CharmEditor } from 'components/common/CharmEditor';
import { CardPropertiesWrapper } from 'components/common/CharmEditor/CardPropertiesWrapper';
import { handleImageFileDrop } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import type { ConnectionEvent } from 'components/common/CharmEditor/components/fiduswriter/ws';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { FormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { EvaluationSidebar } from 'components/proposals/ProposalPage/components/EvaluationSidebar/EvaluationSidebar';
import { ProposalFormFieldInputs } from 'components/proposals/ProposalPage/components/ProposalFormFieldInputs';
import { ProposalStickyFooter } from 'components/proposals/ProposalPage/components/ProposalStickyFooter/ProposalStickyFooter';
import { NewInlineReward } from 'components/rewards/components/NewInlineReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';
import { fontClassName } from 'theme/fonts';

import { AlertContainer } from './components/AlertContainer';
import { PageComments } from './components/CommentsFooter/PageComments';
import PageBanner from './components/PageBanner';
import { PageConnectionBanner } from './components/PageConnectionBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader, { getPageTop } from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import { PrimaryColumn } from './components/PrimaryColumn';
import { ProposalBanner } from './components/ProposalBanner';
import { ProposalProperties } from './components/ProposalProperties';
import { PageSidebar } from './components/Sidebar/PageSidebar';
import { usePageSidebar } from './hooks/usePageSidebar';
import { useProposal } from './hooks/useProposal';

export const defaultPageTop = 56; // we need to add some room for the announcement banner and other banners

const RewardProperties = dynamic(
  () => import('components/rewards/components/RewardProperties/RewardProperties').then((r) => r.RewardProperties),
  { ssr: false }
);

export interface DocumentPageProps {
  page: PageWithContent;
  refreshPage: () => Promise<any>;
  savePage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  close?: VoidFunction;
  insideModal?: boolean;
  enableSidebar?: boolean;
}

function DocumentPage({
  insideModal = false,
  page,
  refreshPage,
  savePage,
  readOnly = false,
  close,
  enableSidebar
}: DocumentPageProps) {
  const { user } = useUser();
  const { router } = useCharmRouter();
  const { activeView: sidebarView, setActiveView, closeSidebar } = usePageSidebar();
  const { editMode, setPageProps, printRef: _printRef } = useCharmEditor();
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [containerRef, { width: containerWidth }] = useElementSize();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const { creatingInlineReward } = useRewards();
  const isMdScreen = useMdScreen();
  const isAdmin = useIsAdmin();
  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;

  const { proposal, refreshProposal, onChangeEvaluation, onChangeWorkflow } = useProposal({
    proposalId
  });

  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || readOnly;

  const card = useAppSelector((state) => {
    if (page?.type !== 'card' && page?.type !== 'card_template') {
      return null;
    }
    return state.cards.cards[page.id] ?? state.cards.templates[page.id];
  });

  const board = useAppSelector((state) => {
    if (!card) {
      return null;
    }

    return state.boards.boards[card.parentId];
  });

  const cards = useAppSelector((state) => {
    return board
      ? [...Object.values(state.cards.cards), ...Object.values(state.cards.templates)].filter(
          (c) => c.parentId === board.id
        )
      : [];
  });

  const boardViews = useAppSelector((state) => {
    if (board) {
      return Object.values(state.views.views).filter((view) => view.parentId === board.id);
    }
    return [];
  });

  const activeBoardView = boardViews[0];

  const showPageBanner = page.type !== 'proposal' && page.type !== 'proposal_template';
  const pageTop = showPageBanner ? getPageTop(page) : defaultPageTop;

  const { threads, isLoading: isLoadingThreads, currentPageId: threadsPageId } = useThreads();
  const isSharedPage = router.pathname.startsWith('/share');
  // Check if we are on the rewards page, as parent chip is only shown on rewards page
  const isRewardsPage = router.pathname === '/[domain]/rewards';
  const showParentChip = !!(page.type === 'card' && page.bountyId && card?.parentId && insideModal && isRewardsPage);
  const { data: reward } = useGetReward({ rewardId: page.bountyId });
  const fontFamilyClassName = `font-family-${page.fontFamily}${page.fontSizeSmall ? ' font-size-small' : ''}`;
  const hideCardDetails = isRewardsPage && page.bountyId;

  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions.comment;
  const isPageTemplate = page.type.includes('template');
  const enableComments = !isSharedPage && !enableSuggestingMode && !isPageTemplate && !!pagePermissions?.comment;
  const showPageActionSidebar =
    !!enableSidebar && sidebarView !== null && (sidebarView !== 'comments' || enableComments);

  const isStructuredProposal = proposal && proposal.formId;

  // create a key that updates when edit mode changes - default to 'editing' so we dont close sockets immediately
  const editorKey = page.id + (editMode || 'editing') + pagePermissions.edit_content;

  function onParticipantUpdate(participants: FrontendParticipant[]) {
    setPageProps({ participants });
  }

  function onConnectionEvent(event: ConnectionEvent) {
    if (event.type === 'error') {
      setConnectionError(event.error);
    } else if (event.type === 'subscribed') {
      // clear out error in case we re-subscribed
      setConnectionError(null);
    }
  }

  const openEvaluation = useCallback(() => {
    setActiveView('proposal_evaluation');
  }, [setActiveView]);

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
    // check page id has changed, otherwwise this runs on every refresh in dev
    if (threadsPageId !== page.id) {
      closeSidebar();
    }
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

  // show page sidebar by default if there are comments or votes
  useEffect(() => {
    if (!enableSidebar) {
      return;
    }
    let highlightedCommentId = new URLSearchParams(window.location.search).get('commentId');
    // hack to handle improperly-created URLs from notifications
    if (highlightedCommentId === 'undefined') {
      highlightedCommentId = null;
    }
    const unresolvedThreads = Object.values(threads)
      .filter((thread) => !thread?.resolved)
      .filter(isTruthy);
    if (sidebarView && !highlightedCommentId) {
      // dont redirect if sidebar is already open
      return;
    }
    if (page.id !== threadsPageId) {
      // threads result is from a different page, maybe during navigation
      return;
    }

    if (!isLoadingThreads) {
      if (highlightedCommentId || (isMdScreen && unresolvedThreads.length)) {
        return setActiveView('comments');
      }
    }
  }, [isLoadingThreads, page.id, enableSidebar, threadsPageId]);

  useEffect(() => {
    if (proposalId && enableSidebar) {
      setActiveView(isMdScreen ? 'proposal_evaluation' : null);
    }
  }, [proposalId, enableSidebar, isMdScreen]);

  // keep a ref in sync for printing
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (printRef?.current !== _printRef?.current) {
      setPageProps({
        printRef
      });
    }
  }, [printRef, _printRef]);

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core[data-page-id="${page.id}"]`)?.dispatchEvent(focusEvent);
  }

  const documentPageContent = (
    <CardPropertiesWrapper>
      {/* Property list */}
      {card && board && !hideCardDetails && (
        <>
          <CardDetailProperties
            syncWithPageId={page.syncWithPageId}
            board={board}
            card={card}
            cards={cards}
            activeView={activeBoardView}
            views={boardViews}
            readOnly={readOnly}
            pageUpdatedAt={page.updatedAt.toString()}
            pageUpdatedBy={page.updatedBy}
          />
          <AddBountyButton readOnly={readOnly} cardId={page.id} />
        </>
      )}
      {proposalId && (
        <ProposalProperties
          enableSidebar={enableSidebar}
          pageId={page.id}
          proposalId={proposalId}
          pagePermissions={pagePermissions}
          readOnly={readonlyProposalProperties}
          proposalPage={page}
          openEvaluation={openEvaluation}
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
          expandedRewardProperties
          isTemplate={page.type === 'bounty_template'}
        />
      )}
      {creatingInlineReward && !readOnly && <NewInlineReward pageId={page.id} />}
      {/** Structured proposal isn't inside a CharmEditor context, thus useViewContext used in PageSidebar would throw error for undefined view */}
      {(enableComments || enableSuggestingMode || page.type === 'proposal' || page.type === 'proposal_template') && (
        <PageSidebar
          id='page-action-sidebar'
          pageId={page.id}
          spaceId={page.spaceId}
          proposalId={proposalId}
          isUnpublishedProposal={proposal?.status === 'draft' || page.type === 'proposal_template'}
          readOnlyProposalPermissions={!proposal?.permissions.edit}
          isReviewer={proposal?.permissions.evaluate}
          pagePermissions={pagePermissions}
          editorState={editorState}
          sidebarView={sidebarView}
          // dont let users collapse sidebar when looking at a proposal
          closeSidebar={closeSidebar}
          openSidebar={setActiveView}
          threads={threads}
          proposal={proposal}
          proposalInput={proposal}
          proposalTemplateId={proposal?.page?.sourceTemplateId}
          onChangeEvaluation={onChangeEvaluation}
          refreshProposal={refreshProposal}
          disabledViews={isStructuredProposal ? ['suggestions', 'comments'] : []}
          onChangeWorkflow={onChangeWorkflow}
        />
      )}
    </CardPropertiesWrapper>
  );

  const proposalAuthors = proposal ? [proposal.createdBy, ...proposal.authors.map((author) => author.userId)] : [];

  return (
    <>
      {!!page?.deletedAt && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <PageDeleteBanner pageType={page.type} pageId={page.id} />
        </AlertContainer>
      )}
      {connectionError && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <PageConnectionBanner />
        </AlertContainer>
      )}
      {page?.convertedProposalId && (
        <AlertContainer showPageActionSidebar={showPageActionSidebar}>
          <ProposalBanner type='page' proposalId={page.convertedProposalId} />
        </AlertContainer>
      )}

      <PrimaryColumn id='file-drop-container' ref={containerRef} showPageActionSidebar={showPageActionSidebar}>
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
          <PageTemplateBanner
            parentId={page.parentId}
            pageType={page.type}
            proposalType={
              page.type === 'proposal_template'
                ? proposal
                  ? proposal.formId
                    ? 'structured'
                    : 'free_form'
                  : undefined
                : undefined
            }
          />
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
                // key={page.title}
                icon={page.icon}
                title={page.title}
                updatedAt={page.updatedAt.toString()}
                readOnly={readOnly || !!enableSuggestingMode}
                setPage={savePage}
                readOnlyTitle={!!page.syncWithPageId}
                parentId={showParentChip ? card.parentId : null}
                insideModal={insideModal}
                pageId={page.id}
                focusDocumentEditor={focusDocumentEditor}
              />
            ) : (
              <PageTitleInput
                // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                // key={page.title}
                value={page.title}
                focusDocumentEditor={focusDocumentEditor}
                updatedAt={page.updatedAt.toString()}
                onChange={(updates) => savePage(updates as { title: string; updatedAt: any })}
                readOnly={readOnly || !!enableSuggestingMode || !!page.syncWithPageId}
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
              <EvaluationSidebar
                pageId={page.id}
                proposal={proposal}
                onChangeEvaluation={onChangeEvaluation}
                refreshProposal={refreshProposal}
              />
            )}

            {currentTab === 0 && (
              <>
                {proposal && proposal.formId ? (
                  <>
                    {documentPageContent}
                    <Box mb={10}>
                      {page.type === 'proposal_template' ? (
                        <FormFieldsEditor
                          readOnly={!isAdmin && (!user || !proposalAuthors.includes(user.id))}
                          proposalId={proposal.id}
                          formFields={proposal?.form.formFields ?? []}
                          refreshProposal={refreshProposal}
                        />
                      ) : (
                        <ProposalFormFieldInputs
                          proposalId={proposal.id}
                          formFields={proposal?.form.formFields ?? []}
                          readOnly={!user || !pagePermissions.edit_content}
                        />
                      )}
                    </Box>
                  </>
                ) : (
                  <CharmEditor
                    placeholderText={
                      page.type === 'bounty' || page.type === 'bounty_template'
                        ? `Describe the reward. Type '/' to see the list of available commands`
                        : undefined
                    }
                    key={editorKey}
                    content={page.content as PageContent}
                    readOnly={readOnly || !!page.syncWithPageId}
                    autoFocus={false}
                    sidebarView={sidebarView}
                    setSidebarView={setActiveView}
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
                    snapshotProposalId={page.snapshotProposalId}
                    onParticipantUpdate={onParticipantUpdate}
                    style={{
                      // 5 lines
                      minHeight: proposalId || page?.type.includes('card') ? '150px' : 'unset'
                    }}
                    disableNestedPages={page?.type === 'proposal' || page?.type === 'proposal_template'}
                    allowClickingFooter={true}
                    threadIds={threadIds}
                  >
                    {documentPageContent}
                  </CharmEditor>
                )}

                {(page.type === 'proposal' || page.type === 'card' || page.type === 'card_synced') && (
                  <Box mt='-100px'>
                    {/* add negative margin to offset height of .charm-empty-footer */}
                    <PageComments page={page} canCreateComments={pagePermissions.comment} />
                  </Box>
                )}
              </>
            )}
          </PageEditorContainer>
        </Box>
        {proposal?.status === 'draft' && page?.type !== 'proposal_template' && (
          <ProposalStickyFooter page={page} proposal={proposal} refreshProposal={refreshProposal} />
        )}
      </PrimaryColumn>
    </>
  );
}

export default memo(DocumentPage);

import type { Page } from '@charmverse/core/dist/prisma';
import styled from '@emotion/styled';
import { useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material';
import Box from '@mui/material/Box';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { memo, useEffect, useRef, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import charmClient from 'charmClient';
import { PageComments } from 'components/[pageId]/Comments/PageComments';
import { ProposalBanner } from 'components/common/Banners/ProposalBanner';
import AddBountyButton from 'components/common/BoardEditor/focalboard/src/components/cardDetail/AddBountyButton';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import { SnapshotVoteDetails } from 'components/common/CharmEditor/components/inlineVote/components/SnapshotVoteDetails';
import { VoteDetail } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useBounties } from 'hooks/useBounties';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useVotes } from 'hooks/useVotes';
import type { AssignedBountyPermissions } from 'lib/bounties';
import type { PageWithContent } from 'lib/pages/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

import BountyProperties from './components/BountyProperties';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';
import { PageTemplateBanner } from './components/PageTemplateBanner';
import ProposalProperties from './components/ProposalProperties';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

export const Container = styled(({ fullWidth, ...props }: any) => <Box {...props} />)<{
  top: number;
  fullWidth?: boolean;
}>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '860px')};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding: 0 80px;
  }
`;

const ScrollContainer = styled.div<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
    height: ${showPageActionSidebar ? 'calc(100vh - 65px)' : '100%'};
    overflow: ${showPageActionSidebar ? 'auto' : 'inherit'};
  }
`
);

const StyledBannerContainer = styled.div<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
  }
`
);

export interface DocumentPageProps {
  page: PageWithContent;
  refreshPage: () => Promise<any>;
  savePage: (p: Partial<Page>) => void;
  readOnly?: boolean;
  insideModal?: boolean;
}

function DocumentPage({ page, refreshPage, savePage, insideModal, readOnly = false }: DocumentPageProps) {
  const { cancelVote, castVote, deleteVote, updateDeadline, votes, isLoading } = useVotes({ pageId: page.id });
  const { draftBounty } = useBounties();
  const { currentPageActionDisplay } = usePageActionDisplay();
  const { editMode, setPageProps, printRef: _printRef } = useCharmEditor();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  // Only populate bounty permission data if this is a bounty page
  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);
  const [containerRef, { width: containerWidth }] = useElementSize();

  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;

  const { permissions: proposalPermissions } = useProposalPermissions({ proposalIdOrPath: proposalId as string });

  // We can only edit the proposal from the top level
  const readonlyProposalProperties = !page.proposalId || readOnly;

  async function refreshBountyPermissions(bountyId: string) {
    setBountyPermissions(
      await charmClient.bounties.computePermissions({
        resourceId: bountyId
      })
    );
  }

  useEffect(() => {
    if (page.bountyId) {
      refreshBountyPermissions(page.bountyId);
    }
  }, [page.bountyId]);

  // keep a ref in sync for printing
  const printRef = useRef(null);
  useEffect(() => {
    if (printRef?.current !== _printRef?.current) {
      setPageProps({
        printRef
      });
    }
  }, [printRef, _printRef]);

  const cannotComment = readOnly || !pagePermissions.comment;

  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions.comment;

  const pageVote = Object.values(votes).find((v) => v.context === 'proposal');

  const card = useAppSelector((state) => {
    if (page.cardId) {
      return state.cards.cards[page.cardId] ?? state.cards.templates[page.cardId] ?? null;
    }
    return null;
  });

  const board = useAppSelector((state) => {
    return card ? state.boards.boards[card.parentId] : null;
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

  const activeView = boardViews[0];

  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  } else if (page.icon) {
    pageTop = 200;
  }

  const comments = useAppSelector(getCardComments(page.cardId ?? page.id));

  const showPageActionSidebar = currentPageActionDisplay !== null && !insideModal;
  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');
  const fontFamilyClassName = `font-family-${page.fontFamily}${page.fontSizeSmall ? ' font-size-small' : ''}`;

  function onParticipantUpdate(participants: FrontendParticipant[]) {
    setPageProps({ participants });
  }

  return (
    <>
      {!!page?.deletedAt && (
        <StyledBannerContainer showPageActionSidebar={showPageActionSidebar}>
          <PageDeleteBanner pageId={page.id} />
        </StyledBannerContainer>
      )}
      {page?.convertedProposalId && <ProposalBanner type='page' proposalId={page.convertedProposalId} />}
      <ScrollableWindow
        sx={{
          overflow: {
            md: showPageActionSidebar ? 'hidden' : 'auto'
          }
        }}
      >
        <div ref={printRef} className='document-print-container'>
          <ScrollContainer id='document-scroll-container' showPageActionSidebar={showPageActionSidebar}>
            <div ref={containerRef}>
              <PageTemplateBanner parentId={page.parentId} pageType={page.type} />
              {/* temporary? disable editing of page meta data when in suggestion mode */}
              {page.headerImage && (
                <PageBanner
                  headerImage={page.headerImage}
                  readOnly={readOnly || !!enableSuggestingMode}
                  setPage={savePage}
                />
              )}
              <Container
                data-test='page-charmeditor'
                className={fontFamilyClassName}
                top={pageTop}
                fullWidth={isSmallScreen || (page.fullWidth ?? false)}
              >
                <CharmEditor
                  placeholderText={
                    page.type === 'bounty' || page.type === 'bounty_template'
                      ? `Describe the bounty. Type '/' to see the list of available commands`
                      : undefined
                  }
                  key={page.id + editMode + String(pagePermissions?.edit_content)}
                  content={page.content as PageContent}
                  readOnly={readOnly}
                  autoFocus={false}
                  pageActionDisplay={!insideModal ? currentPageActionDisplay : null}
                  pageId={page.id}
                  disablePageSpecificFeatures={isSharedPage}
                  enableSuggestingMode={enableSuggestingMode}
                  enableVoting={page.type !== 'proposal'}
                  containerWidth={containerWidth}
                  pageType={page.type}
                  pagePermissions={pagePermissions ?? undefined}
                  onParticipantUpdate={onParticipantUpdate}
                  style={{
                    minHeight: proposalId ? '100px' : 'unset'
                  }}
                  disableNestedPages={page?.type === 'proposal' || page?.type === 'proposal_template'}
                >
                  {/* temporary? disable editing of page title when in suggestion mode */}
                  <PageHeader
                    headerImage={page.headerImage}
                    // Commented for now, as we need to preserve cursor position between re-renders caused by updating this
                    // key={page.title}
                    icon={page.icon}
                    title={page.title}
                    updatedAt={page.updatedAt.toString()}
                    readOnly={readOnly || !!enableSuggestingMode}
                    setPage={savePage}
                  />
                  {page.type === 'proposal' && !isLoading && page.snapshotProposalId && (
                    <Box my={2} className='font-family-default'>
                      <SnapshotVoteDetails snapshotProposalId={page.snapshotProposalId} />
                    </Box>
                  )}
                  {page.type === 'proposal' && !isLoading && pageVote && (
                    <Box my={2} className='font-family-default'>
                      <VoteDetail
                        cancelVote={cancelVote}
                        deleteVote={deleteVote}
                        castVote={castVote}
                        updateDeadline={updateDeadline}
                        vote={pageVote}
                        detailed={false}
                        isProposal={true}
                        disableVote={!proposalPermissions?.vote}
                      />
                    </Box>
                  )}
                  <div className='focalboard-body font-family-default'>
                    <div className='CardDetail content'>
                      {/* Property list */}
                      {card && board && (
                        <>
                          <CardDetailProperties
                            board={board}
                            card={card}
                            cards={cards}
                            activeView={activeView}
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
                          pageId={page.id}
                          proposalId={proposalId}
                          pagePermissions={pagePermissions}
                          refreshPagePermissions={refreshPage}
                          readOnly={readonlyProposalProperties}
                          isTemplate={page.type === 'proposal_template'}
                        />
                      )}
                      {(draftBounty || page.bountyId) && (
                        <BountyProperties
                          bountyId={page.bountyId}
                          pageId={page.id}
                          readOnly={readOnly}
                          permissions={bountyPermissions}
                          refreshBountyPermissions={refreshBountyPermissions}
                        />
                      )}
                      {page.type === 'card' && (
                        <CommentsList
                          comments={comments}
                          rootId={card?.rootId ?? page.id}
                          cardId={card?.id ?? page.id}
                          readOnly={cannotComment}
                        />
                      )}
                    </div>
                  </div>
                </CharmEditor>

                {proposalId && <PageComments page={page} permissions={pagePermissions} />}
              </Container>
            </div>
          </ScrollContainer>
        </div>
      </ScrollableWindow>
    </>
  );
}

export default memo(DocumentPage);

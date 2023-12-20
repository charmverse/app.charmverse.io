import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import { Box, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import type { EditorState } from 'prosemirror-state';
import { memo } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { EvaluationSettingsSidebar } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/EvaluationSettingsSidebar';
import type { Props as ProposalSettingsProps } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/EvaluationSettingsSidebar';
import type { Props as EvaluationSidebarProps } from 'components/proposals/ProposalPage/components/EvaluationSidebar/EvaluationSidebar';
import { EvaluationSidebar } from 'components/proposals/ProposalPage/components/EvaluationSidebar/EvaluationSidebar';
import { OldProposalEvaluationSidebar } from 'components/proposals/ProposalPage/components/EvaluationSidebar/OldProposalEvaluationSidebar';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import type { PageSidebarView } from '../../hooks/usePageSidebar';

import { CommentsSidebar } from './components/CommentsSidebar';
import { PageSidebarViewToggle } from './components/PageSidebarViewToggle';
import { SuggestionsSidebar } from './components/SuggestionsSidebar';
import { SIDEBAR_VIEWS } from './constants';

const DesktopContainer = styled.div`
  position: fixed;
  right: 0px;
  width: 430px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 56px);
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(0, 1)};
  background: ${({ theme }) => theme.palette.background.default};
  border-left: 1px solid var(--input-border);
`;

type SidebarProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  id: string;
  pageId?: string;
  spaceId: string;
  threads?: Record<string, ThreadWithComments | undefined>;
  editorState?: EditorState | null;
  pagePermissions?: PagePermissionFlags | null;
  sidebarView: PageSidebarView | null;
  openSidebar?: (view: PageSidebarView) => void; // leave undefined to hide navigation
  openEvaluationSidebar?: (evaluationId?: string) => void;
  readOnlyProposalPermissions?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  closeSidebar: () => void;
  proposalId?: string | null;
  proposal?: EvaluationSidebarProps['proposal'];
  proposalInput?: ProposalSettingsProps['proposal'];
  onChangeEvaluation?: ProposalSettingsProps['onChangeEvaluation'];
  refreshProposal?: VoidFunction;
  proposalEvaluationId?: string | null;
  isNewProposal?: boolean;
  isProposalTemplate?: boolean;
  readOnlyReviewers?: boolean;
};

function PageSidebarComponent(props: SidebarProps) {
  const { id, proposal, sidebarView, openSidebar, closeSidebar, isNewProposal } = props;
  const isMdScreen = useMdScreen();
  const isCharmVerse = useIsCharmverseSpace();
  const isOpen = sidebarView !== null;
  const sidebarTitle = sidebarView && SIDEBAR_VIEWS[sidebarView]?.title;
  const showEvaluationSidebarIcon =
    (proposal?.evaluationType === 'rubric' &&
      (proposal.status === 'evaluation_active' || proposal?.status === 'evaluation_closed')) ||
    (isCharmVerse && !!proposal);

  function toggleSidebar() {
    if (sidebarView === null) {
      openSidebar?.('comments');
    } else {
      closeSidebar();
    }
  }

  return isMdScreen ? (
    <Slide
      appear={false}
      direction='left'
      in={isOpen}
      style={{
        transformOrigin: 'left top'
      }}
      easing={{
        enter: 'ease-in',
        exit: 'ease-out'
      }}
      timeout={250}
    >
      <DesktopContainer id={id}>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display='flex' gap={1} alignItems='center'>
            <PageSidebarViewToggle onClick={toggleSidebar} />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {sidebarTitle}
            </Typography>
            {openSidebar && (
              <SidebarNavigationIcons
                activeView={sidebarView}
                showEvaluationSidebarIcon={showEvaluationSidebarIcon}
                openSidebar={openSidebar}
                isNewProposal={!!isNewProposal}
              />
            )}
          </Box>
          <SidebarContents {...props} />
        </Box>
      </DesktopContainer>
    </Slide>
  ) : (
    <MobileDialog
      title={sidebarTitle}
      open={isOpen}
      onClose={closeSidebar}
      rightActions={
        openSidebar && (
          <SidebarNavigationIcons
            activeView={sidebarView}
            showEvaluationSidebarIcon={showEvaluationSidebarIcon}
            openSidebar={openSidebar}
            isNewProposal={!!isNewProposal}
          />
        )
      }
      contentSx={{ pb: 0, px: 1 }}
    >
      <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
        <SidebarContents {...props} />
      </Box>
    </MobileDialog>
  );
}

function SidebarNavigationIcons({
  showEvaluationSidebarIcon,
  openSidebar,
  activeView,
  isNewProposal
}: {
  showEvaluationSidebarIcon: boolean;
  openSidebar: (view: PageSidebarView) => void;
  activeView?: PageSidebarView | null;
  isNewProposal: boolean;
}) {
  return (
    <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
      {showEvaluationSidebarIcon && (
        <SidebarViewIcon
          view='proposal_evaluation'
          isActive={!!activeView?.includes('proposal')}
          onClick={openSidebar}
        />
      )}
      {!isNewProposal && (
        <>
          <SidebarViewIcon view='comments' isActive={activeView === 'comments'} onClick={openSidebar} />
          <SidebarViewIcon view='suggestions' isActive={activeView === 'suggestions'} onClick={openSidebar} />
        </>
      )}
    </Box>
  );
}

function SidebarContents({
  sidebarView,
  pageId,
  spaceId,
  pagePermissions,
  readOnlyProposalPermissions,
  editorState,
  threads,
  openSidebar,
  openEvaluationSidebar,
  proposalId,
  proposalEvaluationId,
  proposal,
  proposalInput,
  onChangeEvaluation,
  refreshProposal,
  isProposalTemplate,
  isNewProposal,
  readOnlyReviewers
}: SidebarProps) {
  const isCharmVerse = useIsCharmverseSpace();
  return (
    <>
      {sidebarView === 'proposal_evaluation' &&
        (isCharmVerse ? (
          <EvaluationSidebar
            pageId={pageId}
            proposal={proposal}
            isTemplate={isProposalTemplate}
            isNewProposal={isNewProposal}
            evaluationId={proposalEvaluationId}
            refreshProposal={refreshProposal}
            goToSettings={() => {
              openSidebar?.('proposal_evaluation_settings');
            }}
          />
        ) : (
          <OldProposalEvaluationSidebar pageId={pageId} proposalId={proposalId} />
        ))}
      {sidebarView === 'proposal_evaluation_settings' && (
        <EvaluationSettingsSidebar
          proposal={proposalInput}
          readOnly={!!readOnlyProposalPermissions}
          showHeader={!isNewProposal && !isProposalTemplate}
          onChangeEvaluation={onChangeEvaluation}
          readOnlyReviewers={readOnlyReviewers}
          goToEvaluation={(evaluationId) => {
            openEvaluationSidebar?.(evaluationId);
          }}
        />
      )}
      {sidebarView === 'suggestions' && (
        <SuggestionsSidebar
          pageId={pageId!}
          spaceId={spaceId}
          readOnly={!pagePermissions?.edit_content}
          state={editorState}
        />
      )}
      {sidebarView === 'comments' && (
        <CommentsSidebar
          openSidebar={openSidebar!}
          threads={threads || {}}
          canCreateComments={!!pagePermissions?.comment}
        />
      )}
    </>
  );
}

function SidebarViewIcon({
  view,
  isActive,
  size = 'small',
  onClick
}: {
  isActive: boolean;
  view: PageSidebarView;
  size?: 'small' | 'medium';
  onClick: (view: PageSidebarView) => void;
}) {
  return (
    <Tooltip title={SIDEBAR_VIEWS[view].tooltip}>
      <IconButton color={isActive ? 'inherit' : 'secondary'} size={size} onClick={() => onClick(view)}>
        {SIDEBAR_VIEWS[view].icon}
      </IconButton>
    </Tooltip>
  );
}

export const PageSidebar = memo(PageSidebarComponent);

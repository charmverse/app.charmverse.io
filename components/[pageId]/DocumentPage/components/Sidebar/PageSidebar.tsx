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
  readOnlyProposalPermissions?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  closeSidebar: () => void;
  // eslint-disable-next-line react/no-unused-prop-types
  proposalId?: string | null;
  proposal?: EvaluationSidebarProps['proposal'];
  proposalInput?: ProposalSettingsProps['proposal'];
  onChangeEvaluation: ProposalSettingsProps['onChangeEvaluation'];
  onChangeWorkflow: ProposalSettingsProps['onChangeWorkflow'];
  refreshProposal?: VoidFunction;
  isUnpublishedProposal?: boolean;
  isReviewer?: boolean; // TODO: we need to know the reviewer for each step instead
  // eslint-disable-next-line react/no-unused-prop-types
  disabledViews?: PageSidebarView[];
  pagePath?: string;
  pageTitle?: string;
  proposalTemplateId?: string | null;
};

function PageSidebarComponent(props: SidebarProps) {
  const { disabledViews = [], id, sidebarView, openSidebar, closeSidebar, isUnpublishedProposal } = props;
  const isMdScreen = useMdScreen();
  const isOpen = sidebarView !== null;
  const sidebarTitle = sidebarView && SIDEBAR_VIEWS[sidebarView]?.title;
  const canHideSidebar = isMdScreen && !props.proposalId; // dont allow closing the sidebar when viewing a proposal
  const showEvaluationSidebarIcon = !!props.proposalId;

  function toggleSidebar() {
    if (sidebarView === null) {
      openSidebar?.('comments');
    } else {
      closeSidebar();
    }
  }

  if (sidebarView && disabledViews.includes(sidebarView)) {
    return null;
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
          {!isUnpublishedProposal && (
            <Box display='flex' gap={1} alignItems='center'>
              {canHideSidebar ? <PageSidebarViewToggle onClick={toggleSidebar} /> : <div />}
              <Typography flexGrow={1} fontWeight={600} fontSize={20}>
                {sidebarTitle}
              </Typography>
              {openSidebar && (
                <SidebarNavigationIcons
                  activeView={sidebarView}
                  showEvaluationSidebarIcon={showEvaluationSidebarIcon}
                  openSidebar={openSidebar}
                  isUnpublishedProposal={!!isUnpublishedProposal}
                  disabledViews={disabledViews}
                />
              )}
            </Box>
          )}
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
            disabledViews={disabledViews}
            activeView={sidebarView}
            showEvaluationSidebarIcon={showEvaluationSidebarIcon}
            openSidebar={openSidebar}
            isUnpublishedProposal={!!isUnpublishedProposal}
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
  isUnpublishedProposal,
  disabledViews = []
}: {
  showEvaluationSidebarIcon: boolean;
  openSidebar: (view: PageSidebarView) => void;
  activeView?: PageSidebarView | null;
  isUnpublishedProposal: boolean;
  disabledViews?: PageSidebarView[];
}) {
  return (
    <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
      {showEvaluationSidebarIcon && !disabledViews.includes('proposal_evaluation') && (
        <SidebarViewIcon
          view='proposal_evaluation'
          isActive={!!activeView?.includes('proposal')}
          onClick={openSidebar}
        />
      )}
      {!isUnpublishedProposal && (
        <>
          {!disabledViews.includes('comments') && (
            <SidebarViewIcon view='comments' isActive={activeView === 'comments'} onClick={openSidebar} />
          )}
          {!disabledViews.includes('suggestions') && (
            <SidebarViewIcon view='suggestions' isActive={activeView === 'suggestions'} onClick={openSidebar} />
          )}
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
  proposal,
  proposalInput,
  onChangeEvaluation,
  onChangeWorkflow,
  refreshProposal,
  isUnpublishedProposal,
  isReviewer,
  pagePath,
  pageTitle,
  proposalTemplateId
}: SidebarProps) {
  const isNotNewProposal = !!proposal;
  return (
    <>
      {sidebarView === 'proposal_evaluation' &&
        (isUnpublishedProposal ? (
          <EvaluationSettingsSidebar
            proposal={proposalInput}
            readOnly={!!readOnlyProposalPermissions}
            templateId={proposalTemplateId}
            onChangeEvaluation={onChangeEvaluation}
            onChangeWorkflow={onChangeWorkflow}
            isReviewer={!!isReviewer}
            requireWorkflowChangeConfirmation={isNotNewProposal}
          />
        ) : (
          <EvaluationSidebar
            pagePath={pagePath}
            pageTitle={pageTitle}
            pageId={pageId}
            proposal={proposal}
            onChangeEvaluation={onChangeEvaluation}
            refreshProposal={refreshProposal}
            templateId={proposalTemplateId}
          />
        ))}
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

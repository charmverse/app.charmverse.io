import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import { MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { Box, IconButton, Slide, SvgIcon, Tooltip, Typography } from '@mui/material';
import type { EditorState } from 'prosemirror-state';
import { memo } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import { CommentsSidebar } from './components/CommentsSidebar';
import { PageSidebarViewToggle } from './components/PageSidebarViewToggle';
import { ProposalSidebar } from './components/ProposalSidebar/ProposalSidebar';
import { SuggestionsSidebar } from './components/SuggestionsSidebar';
import type { PageSidebarView } from './hooks/usePageSidebar';

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

export const SIDEBAR_VIEWS = {
  proposal_evaluation: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'View evaluation',
    title: 'Evaluation'
  },
  proposal_evaluation_config: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'Configure evaluations',
    title: 'Set up evaluations'
  },
  comments: {
    icon: <MessageOutlined fontSize='small' />,
    tooltip: 'View all comments',
    title: 'Comments'
  },
  suggestions: {
    icon: <RateReviewOutlined fontSize='small' />,
    tooltip: 'View all suggestions',
    title: 'Suggestions'
  }
} as const;

type SidebarProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  id: string;
  pageId: string;
  spaceId: string;
  threads: Record<string, ThreadWithComments | undefined>;
  editorState: EditorState | null;
  pagePermissions: PagePermissionFlags | null;
  sidebarView: PageSidebarView | null;
  openSidebar?: (view: PageSidebarView) => void; // leave undefined to hide navigation
  // eslint-disable-next-line react/no-unused-prop-types
  closeSidebar: () => void;
  proposalId: string | null;
  proposalEvaluationId?: string;
};

function PageSidebarComponent(props: SidebarProps) {
  const { id, proposalId, sidebarView, openSidebar, closeSidebar } = props;
  const isMdScreen = useMdScreen();
  const isOpen = sidebarView !== null;
  const sidebarTitle = sidebarView && SIDEBAR_VIEWS[sidebarView]?.title;
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);

  const showEvaluationSidebar =
    proposal?.evaluationType === 'rubric' &&
    (proposal.status === 'evaluation_active' || proposal?.status === 'evaluation_closed');

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
              <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
                {showEvaluationSidebar && (
                  <SidebarViewIcon view='proposal_evaluation' activeView={sidebarView} onClick={openSidebar} />
                )}
                <SidebarViewIcon view='comments' activeView={sidebarView} onClick={openSidebar} />
                <SidebarViewIcon view='suggestions' activeView={sidebarView} onClick={openSidebar} />
              </Box>
            )}
          </Box>
          <SidebarContents {...props} proposal={proposal} refreshProposal={refreshProposal} />
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
          <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
            {showEvaluationSidebar && (
              <SidebarViewIcon
                view='proposal_evaluation'
                size='medium'
                activeView={sidebarView}
                onClick={openSidebar}
              />
            )}
            <SidebarViewIcon view='comments' size='medium' activeView={sidebarView} onClick={openSidebar} />
            <SidebarViewIcon view='suggestions' size='medium' activeView={sidebarView} onClick={openSidebar} />
          </Box>
        )
      }
      contentSx={{ pr: 0, pb: 0, pl: 1 }}
    >
      <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
        <SidebarContents {...props} proposal={proposal} refreshProposal={refreshProposal} />
      </Box>
    </MobileDialog>
  );
}

function SidebarContents({
  sidebarView,
  pageId,
  spaceId,
  pagePermissions,
  editorState,
  threads,
  openSidebar,
  proposalId,
  proposalEvaluationId,
  proposal,
  refreshProposal
}: SidebarProps & { proposal?: ProposalWithUsersAndRubric; refreshProposal: VoidFunction }) {
  return (
    <>
      {sidebarView === 'proposal_evaluation' && (
        <ProposalSidebar
          pageId={pageId}
          proposal={proposal}
          proposalId={proposalId}
          refreshProposal={refreshProposal}
        />
      )}
      {sidebarView === 'suggestions' && (
        <SuggestionsSidebar
          pageId={pageId}
          spaceId={spaceId}
          readOnly={!pagePermissions?.edit_content}
          state={editorState}
        />
      )}
      {sidebarView === 'comments' && (
        <CommentsSidebar openSidebar={openSidebar!} threads={threads} canCreateComments={!!pagePermissions?.comment} />
      )}
    </>
  );
}

function SidebarViewIcon({
  view,
  activeView,
  size = 'small',
  onClick
}: {
  activeView: PageSidebarView | null;
  view: PageSidebarView;
  size?: 'small' | 'medium';
  onClick: (view: PageSidebarView) => void;
}) {
  return (
    <Tooltip title={SIDEBAR_VIEWS[view].tooltip}>
      <IconButton color={activeView === view ? 'inherit' : 'secondary'} size={size} onClick={() => onClick(view)}>
        {SIDEBAR_VIEWS[view].icon}
      </IconButton>
    </Tooltip>
  );
}

export const PageSidebar = memo(PageSidebarComponent);

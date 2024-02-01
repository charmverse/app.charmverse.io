import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import { Box, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import type { EditorState } from 'prosemirror-state';
import { memo } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import type { PageSidebarView } from '../../hooks/usePageSidebar';

import { EditorCommentsSidebar, FormCommentsSidebar } from './components/CommentsSidebar';
import { SuggestionsSidebar } from './components/SuggestionsSidebar';
import { TogglePageSidebarButton } from './components/TogglePageButton';
import { SIDEBAR_VIEWS } from './constants';

// const DesktopContainer = styled.div`
//   position: fixed;
//   right: 0px;
//   width: 430px;
//   max-width: 100%;
//   top: 56px; // height of MUI Toolbar
//   z-index: var(--z-index-drawer);
//   height: calc(100% - 56px);
//   overflow: auto;
//   padding: ${({ theme }) => theme.spacing(0, 1)};
//   background: ${({ theme }) => theme.palette.background.default};
//   border-left: 1px solid var(--input-border);
// `;

const sidebarWidth = '430px';
const sidebarMinWidth = '0px';

const DesktopContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(
  ({ open, theme }) => `

  background: ${theme.palette.background.default};
  border-left: 1px solid var(--input-border);
  overflow: auto;
  max-width: ${open ? sidebarWidth : sidebarMinWidth};
  width: 100%;
  transition: max-width ease-in 0.25s;
  height: 100%;
`
);

type SidebarProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  id: string;
  pageId?: string;
  spaceId: string;
  threads?: Record<string, ThreadWithComments | undefined>;
  editorState?: EditorState | null;
  pagePermissions?: PagePermissionFlags | null;
  sidebarView: PageSidebarView | null;
  openSidebar: (view: PageSidebarView) => void;
  // eslint-disable-next-line react/no-unused-prop-types
  closeSidebar: () => void;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    'formId' | 'fields' | 'form' | 'evaluations' | 'workflowId' | 'permissions'
  >;
  // eslint-disable-next-line react/no-unused-prop-types
  disabledViews?: PageSidebarView[];
};

function PageSidebarComponent(props: SidebarProps) {
  const { disabledViews = [], id, sidebarView, openSidebar, closeSidebar } = props;
  const isMdScreen = useMdScreen();
  const isOpen = sidebarView === 'comments' || sidebarView === 'suggestions';
  const sidebarTitle = sidebarView && SIDEBAR_VIEWS[sidebarView]?.title;

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
    // <Slide
    //   appear={false}
    //   direction='left'
    //   in={isOpen}
    //   style={{
    //     transformOrigin: 'left top'
    //   }}
    //   easing={{
    //     enter: 'ease-in',
    //     exit: 'ease-out'
    //   }}
    //   timeout={250}
    // >
    <DesktopContainer id={id} open={isOpen}>
      <Box
        sx={{
          height: '100%',
          gap: 1,
          display: 'flex',
          flexDirection: 'column',
          width: 430,
          px: 1
        }}
      >
        <Box display='flex' gap={1} alignItems='center'>
          <TogglePageSidebarButton onClick={toggleSidebar} />
          <Typography flexGrow={1} fontWeight={600} fontSize={20}>
            {sidebarTitle}
          </Typography>
          {openSidebar && (
            <SidebarNavigationIcons activeView={sidebarView} openSidebar={openSidebar} disabledViews={disabledViews} />
          )}
        </Box>
        <SidebarContents {...props} />
      </Box>
    </DesktopContainer>
  ) : (
    // </Slide>
    <MobileDialog
      title={sidebarTitle}
      open={isOpen}
      onClose={closeSidebar}
      rightActions={
        openSidebar && (
          <SidebarNavigationIcons disabledViews={disabledViews} activeView={sidebarView} openSidebar={openSidebar} />
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
  openSidebar,
  activeView,
  disabledViews = []
}: {
  openSidebar: (view: PageSidebarView) => void;
  activeView?: PageSidebarView | null;
  disabledViews?: PageSidebarView[];
}) {
  return (
    <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
      <>
        {!disabledViews.includes('comments') && (
          <SidebarViewIcon view='comments' isActive={activeView === 'comments'} onClick={openSidebar} />
        )}
        {!disabledViews.includes('suggestions') && (
          <SidebarViewIcon view='suggestions' isActive={activeView === 'suggestions'} onClick={openSidebar} />
        )}
      </>
    </Box>
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
  proposal
}: SidebarProps) {
  return (
    <>
      {sidebarView === 'suggestions' && (
        <SuggestionsSidebar
          pageId={pageId!}
          spaceId={spaceId}
          readOnly={!pagePermissions?.edit_content}
          state={editorState}
        />
      )}
      {sidebarView === 'comments' &&
        (proposal?.formId ? (
          <FormCommentsSidebar
            canCreateComments={!!proposal.permissions?.comment}
            openSidebar={openSidebar!}
            threads={threads}
            formFields={proposal.form.formFields}
          />
        ) : (
          <EditorCommentsSidebar
            openSidebar={openSidebar!}
            threads={threads}
            canCreateComments={!!pagePermissions?.comment}
          />
        ))}
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

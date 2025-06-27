import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import type { PagePermissionFlags } from '@packages/core/permissions';
import type { ProposalWithUsersAndRubric } from '@packages/lib/proposals/interfaces';
import type { ThreadWithComments } from '@packages/lib/threads/interfaces';
import type { EditorState } from 'prosemirror-state';
import { memo } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';

import type { PageSidebarView } from '../../hooks/usePageSidebar';
import { SidebarColumn } from '../DocumentColumnLayout';

import { EditorCommentsSidebar, FormCommentsSidebar } from './components/CommentsSidebar';
import { SidebarContentLayout, SidebarHeader } from './components/SidebarContentLayout';
import { SuggestionsSidebar } from './components/SuggestionsSidebar';
import { TogglePageSidebarButton } from './components/TogglePageButton';
import { SIDEBAR_VIEWS } from './constants';

const sidebarWidth = 430;

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
    <SidebarColumn id={id} open={isOpen} width={sidebarWidth}>
      <SidebarContentLayout width={sidebarWidth}>
        <SidebarHeader>
          <TogglePageSidebarButton onClick={toggleSidebar} />
          <Typography flexGrow={1} fontWeight={600} fontSize={20}>
            {sidebarTitle}
          </Typography>
          {openSidebar && (
            <SidebarNavigationIcons activeView={sidebarView} openSidebar={openSidebar} disabledViews={disabledViews} />
          )}
        </SidebarHeader>
        <SidebarContents {...props} />
      </SidebarContentLayout>
    </SidebarColumn>
  ) : (
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
            enableComments={!!proposal.permissions?.comment}
            openSidebar={openSidebar!}
            threads={threads}
            formFields={proposal.form?.formFields ?? []}
          />
        ) : (
          <EditorCommentsSidebar
            openSidebar={openSidebar!}
            threads={threads}
            enableComments={!!pagePermissions?.comment}
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

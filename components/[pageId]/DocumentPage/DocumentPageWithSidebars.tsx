import { Box, Stack } from '@mui/material';
import type { EditorState } from 'prosemirror-state';
import { memo, useEffect, useState } from 'react';

import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useThreads } from 'hooks/useThreads';
import { isTruthy } from 'lib/utilities/types';

import { PageSidebar } from './components/Sidebar/PageSidebar';
import { ProposalSidebar } from './components/Sidebar/ProposalSidebar';
import type { DocumentPageProps } from './DocumentPage';
import { DocumentPage } from './DocumentPage';
import { usePageSidebar } from './hooks/usePageSidebar';
import { useProposal } from './hooks/useProposal';

const defaultPageTop = 56; // we need to add some room for the announcement banner and other banners

type DocumentPageWithSidebarsProps = DocumentPageProps & {
  readOnly?: boolean;
  insideModal?: boolean;
  enableSidebar?: boolean;
};

function DocumentPageWithSidebarsComponent(props: DocumentPageWithSidebarsProps) {
  const { page, readOnly = false, enableSidebar } = props;
  const { router } = useCharmRouter();
  const { activeView: sidebarView, setActiveView, closeSidebar } = usePageSidebar();
  const { editMode } = useCharmEditor();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const isMdScreen = useMdScreen();
  const pagePermissions = page.permissionFlags;
  const proposalId = page.proposalId;

  const { proposal, refreshProposal, onChangeEvaluation, onChangeWorkflow } = useProposal({
    proposalId
  });

  const { threads, isLoading: isLoadingThreads, currentPageId: threadsPageId } = useThreads();
  const isSharedPage = router.pathname.startsWith('/share');
  const enableSuggestingMode = editMode === 'suggesting' && !readOnly && !!pagePermissions.comment;
  const isPageTemplate = page.type.includes('template');

  const enableComments = !isSharedPage && !enableSuggestingMode && !isPageTemplate && !!pagePermissions?.comment;

  const isStructuredProposal = Boolean(proposal && proposal.formId);
  const isUnpublishedProposal = proposal?.status === 'draft' || page.type === 'proposal_template';

  // reset error and sidebar state whenever page id changes
  useEffect(() => {
    // check page id has changed, otherwwise this runs on every refresh in dev
    if (threadsPageId !== page.id) {
      closeSidebar();
    }
  }, [page.id, threadsPageId]);

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

  return (
    <Stack direction='row' width='100%'>
      <div
        style={{
          // overflowX: hidden is required to shrink the main content less than the 860px width of charm editor
          overflowX: 'hidden',
          flexGrow: 1
        }}
      >
        <DocumentPage
          {...props}
          setEditorState={setEditorState}
          setSidebarView={setActiveView}
          sidebarView={sidebarView}
        />
      </div>
      {(enableComments || enableSuggestingMode) && (
        <PageSidebar
          id='page-action-sidebar'
          pageId={page.id}
          spaceId={page.spaceId}
          pagePermissions={pagePermissions}
          editorState={editorState}
          sidebarView={sidebarView}
          closeSidebar={closeSidebar}
          openSidebar={setActiveView}
          threads={isLoadingThreads ? undefined : threads}
          proposal={proposal}
          disabledViews={isStructuredProposal ? ['suggestions'] : []}
        />
      )}
      {(page.type === 'proposal' || page.type === 'proposal_template') && (
        <ProposalSidebar
          isOpen={sidebarView === 'proposal_evaluation'}
          pagePath={page.path}
          pageTitle={page.title}
          pageId={page.id}
          isUnpublishedProposal={isUnpublishedProposal}
          readOnlyProposalPermissions={!proposal?.permissions.edit}
          isProposalTemplate={page.type === 'proposal_template'}
          isReviewer={proposal?.permissions.evaluate}
          isStructuredProposal={isStructuredProposal}
          closeSidebar={closeSidebar}
          openSidebar={() => setActiveView('proposal_evaluation')}
          proposal={proposal}
          proposalInput={proposal}
          templateId={proposal?.page?.sourceTemplateId}
          onChangeEvaluation={onChangeEvaluation}
          refreshProposal={refreshProposal}
          onChangeWorkflow={onChangeWorkflow}
        />
      )}
    </Stack>
  );
}

export const DocumentPageWithSidebars = memo(DocumentPageWithSidebarsComponent);

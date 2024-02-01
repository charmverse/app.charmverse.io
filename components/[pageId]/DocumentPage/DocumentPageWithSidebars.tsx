import type { EditorState } from 'prosemirror-state';
import { memo, useEffect, useState } from 'react';

import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useThreads } from 'hooks/useThreads';
import { isTruthy } from 'lib/utilities/types';

import { DocumentColumnLayout, DocumentColumn } from './components/DocumentColumnLayout';
import { PageSidebar } from './components/Sidebar/PageSidebar';
import { ProposalSidebar } from './components/Sidebar/ProposalSidebar';
import type { DocumentPageProps } from './DocumentPage';
import { DocumentPage } from './DocumentPage';
import { usePageSidebar } from './hooks/usePageSidebar';
import { useProposal } from './hooks/useProposal';

type DocumentPageWithSidebarsProps = DocumentPageProps & {
  readOnly?: boolean;
  insideModal?: boolean;
};

function DocumentPageWithSidebarsComponent(props: DocumentPageWithSidebarsProps) {
  const { page, readOnly = false } = props;
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
  }, [isLoadingThreads, page.id, threadsPageId]);

  // having `internalSidebarView` allows us to have the sidebar open by default, because usePageSidebar() does not allow us to do this currently
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>(
    proposalId ? 'proposal_evaluation' : null
  );
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    setActiveView(defaultSidebarView);
    setDefaultView(null);
  }, []);

  return (
    <DocumentColumnLayout>
      <DocumentColumn>
        <DocumentPage
          {...props}
          setEditorState={setEditorState}
          setSidebarView={setActiveView}
          sidebarView={internalSidebarView}
        />
      </DocumentColumn>
      {(enableComments || enableSuggestingMode) && (
        <PageSidebar
          id='page-action-sidebar'
          pageId={page.id}
          spaceId={page.spaceId}
          pagePermissions={pagePermissions}
          editorState={editorState}
          sidebarView={internalSidebarView}
          closeSidebar={closeSidebar}
          openSidebar={setActiveView}
          threads={isLoadingThreads ? undefined : threads}
          proposal={proposal}
          disabledViews={isStructuredProposal ? ['suggestions'] : []}
        />
      )}
      {(page.type === 'proposal' || page.type === 'proposal_template') && (
        <ProposalSidebar
          isOpen={internalSidebarView === 'proposal_evaluation'}
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
    </DocumentColumnLayout>
  );
}

export const DocumentPageWithSidebars = memo(DocumentPageWithSidebarsComponent);

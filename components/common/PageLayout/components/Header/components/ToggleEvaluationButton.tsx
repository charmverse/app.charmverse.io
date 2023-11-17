import { IconButton, Tooltip } from '@mui/material';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { useLastSidebarView } from 'components/[pageId]/DocumentPage/hooks/useLastSidebarView';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { usePageSidebar } from 'hooks/usePageSidebar';

export function ToggleEvaluationButton({ isInsideDialog, pageId }: { isInsideDialog?: boolean; pageId?: string }) {
  const { activeView, setActiveView } = usePageSidebar();
  const { navigateToSpacePath } = useCharmRouter();
  const [, saveSidebarView] = useLastSidebarView();

  const isActive = activeView === 'proposal_evaluation';

  function openEvaluation() {
    // close sidebar if open
    if (isActive) {
      setActiveView(null);
    } else if (!isInsideDialog) {
      // open inside full page
      setActiveView('proposal_evaluation');
    } else if (pageId) {
      // set default sidebar and open full page
      saveSidebarView({
        [pageId]: 'proposal_evaluation'
      });
      navigateToSpacePath(`/${pageId}`);
    }
  }

  return (
    <Tooltip arrow title={isActive ? 'Close evaluation' : 'Open evaluation'}>
      <IconButton onClick={openEvaluation} sx={{ backgroundColor: isActive ? 'var(--input-bg)' : '' }}>
        {SIDEBAR_VIEWS.proposal_evaluation.icon}
      </IconButton>
    </Tooltip>
  );
}

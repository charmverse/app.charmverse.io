import { IconButton, Tooltip } from '@mui/material';

import { usePageSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/hooks/usePageSidebar';
import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { useCharmRouter } from 'hooks/useCharmRouter';

export function ToggleEvaluationButton({ isInsideDialog, pageId }: { isInsideDialog?: boolean; pageId?: string }) {
  const { activeView, closeSidebar, setActiveView, persistActiveView } = usePageSidebar();
  const { navigateToSpacePath } = useCharmRouter();

  const isActive = activeView?.includes('proposal');

  function toggleEvaluation() {
    // close sidebar if open
    if (isActive) {
      closeSidebar();
    } else if (!isInsideDialog) {
      // open inside full page
      setActiveView('proposal_evaluation');
    } else if (pageId) {
      // set default sidebar and open full page
      persistActiveView({
        [pageId]: 'proposal_evaluation'
      });
      navigateToSpacePath(`/${pageId}`);
    }
  }

  return (
    <Tooltip arrow title={isActive ? 'Close evaluation' : 'Open evaluation'}>
      <IconButton onClick={toggleEvaluation} sx={{ backgroundColor: isActive ? 'var(--input-bg)' : '' }}>
        {SIDEBAR_VIEWS.proposal_evaluation.icon}
      </IconButton>
    </Tooltip>
  );
}

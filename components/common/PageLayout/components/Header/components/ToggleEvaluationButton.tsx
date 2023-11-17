import { IconButton, Tooltip } from '@mui/material';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { usePageSidebar } from 'hooks/usePageSidebar';

export function ToggleEvaluationButton() {
  const { activeView, setActiveView } = usePageSidebar();

  const isActive = activeView === 'proposal_evaluation';

  return (
    <Tooltip arrow title={isActive ? 'Close evaluation' : 'Open evaluation'}>
      <IconButton
        onClick={() => setActiveView(isActive ? null : 'proposal_evaluation')}
        sx={{ backgroundColor: isActive ? 'var(--input-bg)' : '' }}
      >
        {SIDEBAR_VIEWS.proposal_evaluation.icon}
      </IconButton>
    </Tooltip>
  );
}

import { IconButton, Tooltip } from '@mui/material';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/DocumentSidebar';
import { usePageSidebar } from 'hooks/usePageSidebar';

export function ToggleEvaluationButton() {
  const { activeView, setActiveView } = usePageSidebar();

  const isActive = activeView === 'proposal_evaluation';

  return (
    <Tooltip arrow title='View evaluations'>
      <IconButton
        onClick={() => setActiveView('proposal_evaluation')}
        sx={{ backgroundColor: isActive ? 'var(--input-bg)' : '' }}
      >
        {SIDEBAR_VIEWS.proposal_evaluation.icon}
      </IconButton>
    </Tooltip>
  );
}

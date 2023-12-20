import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/constants';
import { Button } from 'components/common/Button';

export function OpenEvaluationButton({
  disabled,
  isEvaluationSidebarOpen,
  onClick
}: {
  disabled?: boolean;
  isEvaluationSidebarOpen: boolean;
  onClick: () => void;
}) {
  const disabledTooltip =
    disabled && isEvaluationSidebarOpen
      ? 'This is currently under review. You do not have permissions to see the results'
      : '';

  return (
    <Button
      disabled={!!disabledTooltip}
      disabledTooltip={disabledTooltip}
      endIcon={isEvaluationSidebarOpen ? <ChevronRightIcon /> : SIDEBAR_VIEWS.proposal_evaluation.icon}
      onClick={onClick}
    >
      {isEvaluationSidebarOpen ? 'Close evaluation' : 'Evaluate'}
    </Button>
  );
}

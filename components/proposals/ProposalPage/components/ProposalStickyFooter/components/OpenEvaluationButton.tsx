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
  const disabledTooltip = disabled
    ? 'This is currently under review. You do not have permissions to see the results'
    : '';

  return (
    <Button
      disabled={!!disabledTooltip}
      disabledTooltip={disabledTooltip}
      endIcon={SIDEBAR_VIEWS.proposal_evaluation.icon}
      onClick={onClick}
    >
      Evaluate
    </Button>
  );
}

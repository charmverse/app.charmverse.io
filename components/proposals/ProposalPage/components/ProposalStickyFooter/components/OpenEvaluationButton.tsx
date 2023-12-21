import { ProposalEvaluationType } from '@charmverse/core/prisma';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/constants';
import { Button } from 'components/common/Button';

const buttonLabels = {
  [ProposalEvaluationType.vote]: {
    close: 'Close vote',
    open: 'Vote'
  },
  default: {
    close: 'Close evaluation',
    open: 'Evaluate'
  }
};

export function OpenEvaluationButton({
  currentStep,
  disabled,
  isEvaluationSidebarOpen,
  onClick
}: {
  currentStep?: { type: ProposalEvaluationType };
  disabled?: boolean;
  isEvaluationSidebarOpen: boolean;
  onClick: () => void;
}) {
  const disabledTooltip =
    disabled && isEvaluationSidebarOpen
      ? 'This is currently under review. You do not have permissions to see the results'
      : '';

  const label = currentStep?.type === 'vote' ? buttonLabels.vote : buttonLabels.default;

  return (
    <Button
      disabled={!!disabledTooltip}
      disabledTooltip={disabledTooltip}
      endIcon={isEvaluationSidebarOpen ? <ChevronRightIcon /> : SIDEBAR_VIEWS.proposal_evaluation.icon}
      onClick={onClick}
    >
      {isEvaluationSidebarOpen ? label.close : label.open}
    </Button>
  );
}

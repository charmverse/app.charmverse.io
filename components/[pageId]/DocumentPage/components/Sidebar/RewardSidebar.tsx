import { memo } from 'react';

import { WorkflowSidebar, type SidebarProps } from 'components/common/workflows/WorkflowSidebar';
import type { RewardEvaluationsProps } from 'components/rewards/components/RewardEvaluations/RewardEvaluations';
import { RewardEvaluations } from 'components/rewards/components/RewardEvaluations/RewardEvaluations';

import { SIDEBAR_VIEWS } from './constants';

type Props = Omit<RewardEvaluationsProps, 'expanded'> & {
  sidebarProps: SidebarProps;
};

function SidebarComponent(props: Props) {
  const { sidebarProps, ...rewardProps } = props;
  return (
    <WorkflowSidebar title={SIDEBAR_VIEWS.reward_evaluation.title} {...props.sidebarProps}>
      <RewardEvaluations {...rewardProps} expanded={sidebarProps.isOpen} />
    </WorkflowSidebar>
  );
}

export const RewardSidebar = memo(SidebarComponent);

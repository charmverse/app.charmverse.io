import { memo } from 'react';

import { WorkflowSidebar, type SidebarProps } from 'components/common/WorkflowSidebar/WorkflowSidebar';
import { ProposalNotesLink } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/ProposalNotesLink';
import type { ProposalEvaluationsProps } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';

import { SIDEBAR_VIEWS } from './constants';

type Props = ProposalEvaluationsProps & {
  sidebarProps: SidebarProps;
};

function SidebarComponent(props: Props) {
  const { sidebarProps, ...proposalProps } = props;

  return (
    <WorkflowSidebar
      title={SIDEBAR_VIEWS.proposal_evaluation.title}
      headerContent={
        proposalProps.proposal?.permissions.view_notes && <ProposalNotesLink proposalId={props.proposal?.id} />
      }
      {...props.sidebarProps}
    >
      <ProposalEvaluations {...proposalProps} expanded={sidebarProps.isOpen} />
    </WorkflowSidebar>
  );
}

export const ProposalSidebar = memo(SidebarComponent);

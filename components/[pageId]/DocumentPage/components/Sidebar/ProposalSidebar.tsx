import { Box, Typography } from '@mui/material';
import { memo } from 'react';

import type { ProposalEvaluationsProps } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { useMdScreen } from 'hooks/useMediaScreens';

import { SidebarColumn } from '../DocumentColumnLayout';

import { SidebarContentLayout, SidebarHeader } from './components/SidebarContentLayout';
import { ToggleProposalSidebarButton } from './components/ToggleProposalButton';
import { SIDEBAR_VIEWS } from './constants';

const sidebarWidth = 430;
const sidebarMinWidth = 54;

type SidebarProps = ProposalEvaluationsProps & {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

function SidebarComponent(props: SidebarProps) {
  const { isOpen, openSidebar, closeSidebar } = props;
  const isMdScreen = useMdScreen();

  function toggleSidebar() {
    (isOpen ? closeSidebar : openSidebar)();
  }
  if (!isMdScreen) {
    // this UI appears under a tab on mobile
    return null;
  }
  return (
    <SidebarColumn id='proposal-action-sidebar' open={isOpen} width={sidebarWidth} minWidth={sidebarMinWidth}>
      <SidebarContentLayout>
        <SidebarHeader>
          <ToggleProposalSidebarButton isOpen={isOpen} onClick={toggleSidebar} />
          {isOpen && (
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {SIDEBAR_VIEWS.proposal_evaluation.title}
            </Typography>
          )}
        </SidebarHeader>
        <Box overflow='auto' height='100%' px={1} onClick={openSidebar}>
          <ProposalEvaluations {...props} expanded={isOpen} />
        </Box>
      </SidebarContentLayout>
    </SidebarColumn>
  );
}

export const ProposalSidebar = memo(SidebarComponent);

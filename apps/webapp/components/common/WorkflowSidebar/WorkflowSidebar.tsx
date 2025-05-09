import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { SidebarColumn } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import {
  SidebarContentLayout,
  SidebarHeader
} from 'components/[pageId]/DocumentPage/components/Sidebar/components/SidebarContentLayout';
import { ToggleProposalSidebarButton } from 'components/[pageId]/DocumentPage/components/Sidebar/components/ToggleProposalButton';
import { useMdScreen } from 'hooks/useMediaScreens';

const sidebarWidth = 430;
const sidebarMinWidth = 54;

export type SidebarProps = {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

function SidebarComponent(
  props: SidebarProps & {
    title: string;
    headerContent?: ReactNode;
    children: ReactNode;
  }
) {
  const { isOpen, openSidebar, closeSidebar, title, children } = props;
  const isMdScreen = useMdScreen();

  function toggleSidebar() {
    (isOpen ? closeSidebar : openSidebar)();
  }
  if (!isMdScreen) {
    // this UI appears under a tab on mobile
    return null;
  }
  return (
    <SidebarColumn id='workflow-action-sidebar' open={isOpen} width={sidebarWidth} minWidth={sidebarMinWidth}>
      <SidebarContentLayout>
        <SidebarHeader pr={2}>
          <ToggleProposalSidebarButton isOpen={isOpen} onClick={toggleSidebar} />
          {isOpen && (
            <>
              <Typography flexGrow={1} fontWeight={600} fontSize={20}>
                {title}
              </Typography>
              {props.headerContent}
            </>
          )}
        </SidebarHeader>
        <Box overflow='auto' height='100%' px={1} onClick={openSidebar}>
          {props.children}
        </Box>
      </SidebarContentLayout>
    </SidebarColumn>
  );
}

export const WorkflowSidebar = memo(SidebarComponent);

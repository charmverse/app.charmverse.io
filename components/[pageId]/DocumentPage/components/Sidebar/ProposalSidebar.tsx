import styled from '@emotion/styled';
import { Box, Slide, Typography } from '@mui/material';
import { memo } from 'react';

import type { ProposalEvaluationsProps } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { useMdScreen } from 'hooks/useMediaScreens';

import { SIDEBAR_VIEWS } from './constants';

const DesktopContainer = styled.div`
  position: fixed;
  right: 0px;
  width: 430px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 56px);
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(0, 1)};
  background: ${({ theme }) => theme.palette.background.default};
  border-left: 1px solid var(--input-border);
`;

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
    return null;
  }
  return (
    <Slide
      appear={false}
      direction='left'
      in={props.isOpen}
      style={{
        transformOrigin: 'left top'
      }}
      easing={{
        enter: 'ease-in',
        exit: 'ease-out'
      }}
      timeout={250}
    >
      <DesktopContainer id='proposal-action-sidebar'>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display='flex' gap={1} alignItems='center'>
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {SIDEBAR_VIEWS.proposal_evaluation.title}
            </Typography>
          </Box>
          <ProposalEvaluations {...props} />
        </Box>
      </DesktopContainer>
    </Slide>
  );
}

export const ProposalSidebar = memo(SidebarComponent);

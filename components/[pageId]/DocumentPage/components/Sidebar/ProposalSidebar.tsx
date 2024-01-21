import styled from '@emotion/styled';
import { Box, Slide, Typography } from '@mui/material';
import { memo } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { EvaluationSettingsSidebar } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/EvaluationSettingsSidebar';
import type { Props as ProposalSettingsProps } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/EvaluationSettingsSidebar';
import type { Props as EvaluationSidebarProps } from 'components/proposals/ProposalPage/components/EvaluationSidebar/EvaluationSidebar';
import { EvaluationSidebar } from 'components/proposals/ProposalPage/components/EvaluationSidebar/EvaluationSidebar';
import { useMdScreen } from 'hooks/useMediaScreens';

import type { PageSidebarView } from '../../hooks/usePageSidebar';

import { PageSidebarViewToggle } from './components/PageSidebarViewToggle';
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

type SidebarProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  id: string;
  pageId?: string;
  // eslint-disable-next-line react/no-unused-prop-types
  isOpen: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  isUnpublishedProposal: boolean;
  readOnlyProposalPermissions?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  closeSidebar: () => void;
  // eslint-disable-next-line react/no-unused-prop-types
  proposalId?: string | null;
  proposal?: EvaluationSidebarProps['proposal'];
  proposalInput?: ProposalSettingsProps['proposal'];
  onChangeEvaluation: ProposalSettingsProps['onChangeEvaluation'];
  onChangeWorkflow: ProposalSettingsProps['onChangeWorkflow'];
  refreshProposal?: VoidFunction;
  isReviewer?: boolean; // TODO: we need to know the reviewer for each step instead
  // eslint-disable-next-line react/no-unused-prop-types
  disabledViews?: PageSidebarView[];
  pagePath?: string;
  pageTitle?: string;
  proposalTemplateId?: string | null;
};

function PageSidebarComponent(props: SidebarProps) {
  const { id, closeSidebar, isUnpublishedProposal } = props;
  const isMdScreen = useMdScreen();
  const canHideSidebar = isMdScreen && !props.proposalId; // dont allow closing the sidebar when viewing a proposal

  function toggleSidebar() {
    closeSidebar();
  }
  return isMdScreen ? (
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
      <DesktopContainer id={id}>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {!isUnpublishedProposal && (
            <Box display='flex' gap={1} alignItems='center'>
              {canHideSidebar ? <PageSidebarViewToggle onClick={toggleSidebar} /> : <div />}
              <Typography flexGrow={1} fontWeight={600} fontSize={20}>
                {SIDEBAR_VIEWS.proposal_evaluation.title}
              </Typography>
            </Box>
          )}
          <SidebarContents {...props} />
        </Box>
      </DesktopContainer>
    </Slide>
  ) : (
    <MobileDialog
      title={SIDEBAR_VIEWS.proposal_evaluation.title}
      open={props.isOpen}
      onClose={closeSidebar}
      contentSx={{ pb: 0, px: 1 }}
    >
      <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
        <SidebarContents {...props} />
      </Box>
    </MobileDialog>
  );
}

function SidebarContents({
  pageId,
  readOnlyProposalPermissions,
  proposal,
  proposalInput,
  onChangeEvaluation,
  onChangeWorkflow,
  refreshProposal,
  isReviewer,
  pagePath,
  pageTitle,
  isUnpublishedProposal,
  proposalTemplateId
}: SidebarProps) {
  if (isUnpublishedProposal) {
    const isNotNewProposal = !!proposal;
    return (
      <EvaluationSettingsSidebar
        proposal={proposalInput}
        readOnly={!!readOnlyProposalPermissions}
        templateId={proposalTemplateId}
        onChangeEvaluation={onChangeEvaluation}
        onChangeWorkflow={onChangeWorkflow}
        isReviewer={!!isReviewer}
        requireWorkflowChangeConfirmation={isNotNewProposal}
      />
    );
  } else {
    return (
      <EvaluationSidebar
        pagePath={pagePath}
        pageTitle={pageTitle}
        pageId={pageId}
        proposal={proposal}
        onChangeEvaluation={onChangeEvaluation}
        refreshProposal={refreshProposal}
        templateId={proposalTemplateId}
      />
    );
  }
}

export const ProposalSidebar = memo(PageSidebarComponent);

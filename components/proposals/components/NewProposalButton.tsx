import type { PageMeta } from '@charmverse/core/pages';
import styled from '@emotion/styled';
import { KeyboardArrowDown } from '@mui/icons-material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Box, ButtonGroup, Stack, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { usePages } from 'hooks/usePages';
import { isTruthy } from 'lib/utilities/types';

import { useProposalCategories } from '../hooks/useProposalCategories';
import { useProposalTemplates } from '../hooks/useProposalTemplates';
import type { ProposalPageAndPropertiesInput } from '../ProposalPage/NewProposalPage';

const ProposalTemplateMenu = styled(Stack)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
    transition: background-color 0.2s ease-in-out;
  }
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: row;
  align-items: center;
`;

export function NewProposalButton() {
  const { navigateToSpacePath } = useCharmRouter();

  const { proposalCategoriesWithCreatePermission } = useProposalCategories();
  const isAdmin = useIsAdmin();
  const { pages } = usePages();
  const proposalTemplateCreateModalState = usePopupState({ variant: 'dialog' });
  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();

  const canCreateProposal = proposalCategoriesWithCreatePermission.length > 0;
  // grab page data from context so that title is always up-to-date
  const proposalTemplatePages = proposalTemplates
    ?.map(
      (template) =>
        ({ ...pages[template.page.id], isStructuredProposal: !!template.formId } as PageMeta & {
          isStructuredProposal: boolean;
        })
    )
    .filter(isTruthy);

  function deleteProposalTemplate(pageId: string) {
    return charmClient.deletePage(pageId);
  }

  function editTemplate(pageId: string) {
    navigateToSpacePath(`/${pageId}`);
  }

  function createTemplate(proposalType: ProposalPageAndPropertiesInput['proposalType']) {
    navigateToSpacePath('/proposals/new', { type: 'proposal_template', proposalType });
  }

  function createFromTemplate(pageId: string) {
    navigateToSpacePath(`/proposals/new`, { template: pageId });
  }

  return (
    <>
      <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
        <Box>
          <ButtonGroup variant='contained' ref={buttonRef}>
            <Button disabled={!canCreateProposal} href='/proposals/new' data-test='new-proposal-button'>
              Create
            </Button>
            <Button
              data-test='proposal-template-select'
              size='small'
              disabled={!canCreateProposal}
              onClick={popupState.open}
            >
              <KeyboardArrowDown />
            </Button>
          </ButtonGroup>
        </Box>
      </Tooltip>
      <TemplatesMenu
        isLoading={isLoadingTemplates}
        addPageFromTemplate={createFromTemplate}
        editTemplate={editTemplate}
        pages={proposalTemplatePages}
        createTemplate={proposalTemplateCreateModalState.open}
        deleteTemplate={deleteProposalTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle='Proposals'
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />

      <Modal
        title='Select a template type'
        open={proposalTemplateCreateModalState.isOpen}
        onClose={proposalTemplateCreateModalState.close}
      >
        <Stack spacing={2}>
          <ProposalTemplateMenu
            onClick={() => createTemplate('structured')}
            data-test='structured-proposal-template-menu'
          >
            <WidgetsOutlinedIcon fontSize='large' />
            <Typography variant='h6'>Form</Typography>
          </ProposalTemplateMenu>
          <ProposalTemplateMenu
            onClick={() => createTemplate('free_form')}
            data-test='free_form-proposal-template-menu'
          >
            <DescriptionOutlinedIcon fontSize='large' />
            <Typography variant='h6'>Document</Typography>
          </ProposalTemplateMenu>
        </Stack>
      </Modal>
    </>
  );
}

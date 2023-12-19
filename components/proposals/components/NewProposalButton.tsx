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
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { usePages } from 'hooks/usePages';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { useProposalCategories } from '../hooks/useProposalCategories';
import { useProposalTemplates } from '../hooks/useProposalTemplates';

import type { ProposalPageAndPropertiesInput } from './ProposalDialog/NewProposalPage';

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
`;

export function NewProposalButton({
  showProposal,
  showNewProposal
}: {
  showProposal: (pageId: string) => void;
  showNewProposal: (input?: Partial<ProposalPageAndPropertiesInput>) => void;
}) {
  const { proposalCategoriesWithCreatePermission } = useProposalCategories();
  const isAdmin = useIsAdmin();
  const { pages } = usePages();
  const proposalTemplateCreateModalState = usePopupState({ variant: 'dialog' });
  const isCharmverseSpace = useIsCharmverseSpace();
  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();

  const canCreateProposal = proposalCategoriesWithCreatePermission.length > 0;
  // grab page data from context so that title is always up-to-date
  const proposalTemplatePages = proposalTemplates?.map((template) => pages[template.page.id]).filter(isTruthy);

  async function createProposalFromTemplate(templateId: string) {
    const proposalTemplate = proposalTemplates?.find((proposal) => proposal.id === templateId);
    if (proposalTemplate) {
      showNewProposal({
        contentText: proposalTemplate.page.contentText ?? '',
        content: proposalTemplate.page.content as PageContent,
        proposalTemplateId: templateId,
        evaluationType: proposalTemplate.evaluationType,
        headerImage: proposalTemplate.page.headerImage,
        icon: proposalTemplate.page.icon,
        categoryId: proposalTemplate.categoryId as string,
        reviewers: proposalTemplate.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: (reviewer.roleId ?? reviewer.userId) as string
        })),
        rubricCriteria: proposalTemplate.rubricCriteria,
        fields: (proposalTemplate.fields as ProposalFields) || {},
        type: 'proposal'
      });
    }
  }

  function deleteProposalTemplate(pageId: string) {
    return charmClient.deletePage(pageId);
  }

  async function createProposalTemplate(proposalType: ProposalPageAndPropertiesInput['proposalType']) {
    showNewProposal({
      type: 'proposal_template',
      proposalType
    });
    popupState.close();
    proposalTemplateCreateModalState.close();
  }

  async function onClickCreate() {
    showNewProposal();
  }

  return (
    <>
      <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
        <Box>
          <ButtonGroup variant='contained' ref={buttonRef}>
            <Button disabled={!canCreateProposal} onClick={onClickCreate} data-test='new-proposal-button'>
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
        pages={proposalTemplatePages}
        addPageFromTemplate={createProposalFromTemplate}
        createTemplate={() =>
          !isCharmverseSpace ? createProposalTemplate('free-form') : proposalTemplateCreateModalState.open()
        }
        editTemplate={(pageId) => showProposal(pageId)}
        deleteTemplate={deleteProposalTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle='Proposals'
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />

      <Modal
        size='fluid'
        title='Select a template type'
        open={proposalTemplateCreateModalState.isOpen}
        onClose={proposalTemplateCreateModalState.close}
      >
        <Stack spacing={2}>
          <ProposalTemplateMenu onClick={() => createProposalTemplate('structured')}>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <WidgetsOutlinedIcon fontSize='large' />
              <Typography variant='h5'>Structured Form</Typography>
            </Stack>
            <Typography variant='body2'>
              Create a template using Forms, creating a structured data format for each proposal to conform to.
            </Typography>
          </ProposalTemplateMenu>
          <ProposalTemplateMenu onClick={() => createProposalTemplate('free-form')}>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <DescriptionOutlinedIcon fontSize='large' />
              <Typography variant='h5'>Free Form</Typography>
            </Stack>
            <Typography variant='body2'>Create a template using an open editor.</Typography>
          </ProposalTemplateMenu>
        </Stack>
      </Modal>
    </>
  );
}

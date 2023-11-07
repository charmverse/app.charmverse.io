import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, ButtonGroup, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useRef } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { useProposalCategories } from '../hooks/useProposalCategories';
import { useProposalTemplates } from '../hooks/useProposalTemplates';

import type { ProposalPageAndPropertiesInput } from './ProposalDialog/NewProposalPage';

export function NewProposalButton({
  showProposal,
  showNewProposal
}: {
  showProposal: (pageId: string) => void;
  showNewProposal: (input?: Partial<ProposalPageAndPropertiesInput>) => void;
}) {
  const router = useRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { proposalCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const isAdmin = useIsAdmin();
  const { pages, mutatePage } = usePages();

  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { proposalTemplates, deleteProposalTemplate, isLoadingTemplates } = useProposalTemplates();

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

  async function createProposalTemplate() {
    showNewProposal({
      type: 'proposal_template'
    });
    popupState.close();
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
        createTemplate={createProposalTemplate}
        editTemplate={(pageId) => showProposal(pageId)}
        deleteTemplate={deleteProposalTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle='Proposals'
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />
    </>
  );
}

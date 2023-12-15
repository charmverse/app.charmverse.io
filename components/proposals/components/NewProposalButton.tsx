import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, ButtonGroup, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import { isTruthy } from 'lib/utilities/types';

import { useProposalCategories } from '../hooks/useProposalCategories';
import { useProposalTemplates } from '../hooks/useProposalTemplates';

export function NewProposalButton() {
  const { proposalCategoriesWithCreatePermission } = useProposalCategories();
  const isAdmin = useIsAdmin();
  const { pages } = usePages();
  const { navigateToSpacePath } = useCharmRouter();

  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();

  const canCreateProposal = proposalCategoriesWithCreatePermission.length > 0;
  // grab page data from context so that title is always up-to-date
  const proposalTemplatePages = proposalTemplates?.map((template) => pages[template.page.id]).filter(isTruthy);
  function deleteProposalTemplate(pageId: string) {
    return charmClient.deletePage(pageId);
  }

  function editTemplate(pageId: string) {
    navigateToSpacePath(`/${pageId}`);
  }
  function createTemplate() {
    navigateToSpacePath('/proposals/new', { type: 'proposal_template' });
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
        createTemplate={createTemplate}
        addPageFromTemplate={createFromTemplate}
        editTemplate={editTemplate}
        pages={proposalTemplatePages}
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

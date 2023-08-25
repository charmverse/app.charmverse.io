import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { KeyboardArrowDown } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Box, ButtonGroup, Tooltip, useMediaQuery } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { useProposalCategories } from '../hooks/useProposalCategories';
import { useProposalTemplates } from '../hooks/useProposalTemplates';

import { useProposalDialog } from './ProposalDialog/hooks/useProposalDialog';

export function NewProposalButton({ mutateProposals }: { mutateProposals: KeyedMutator<ProposalWithUsers[]> }) {
  const router = useRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { showProposal } = useProposalDialog();
  const { proposalCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const isAdmin = useIsAdmin();
  const { mutatePage } = usePages();
  const isXsScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { createProposal } = useProposalDialog();
  const { proposalTemplatePages, deleteProposalTemplate, isLoadingTemplates } = useProposalTemplates();

  const canCreateProposal = proposalCategoriesWithCreatePermission.length > 0;

  async function createProposalFromTemplate(templateId: string) {
    const proposalTemplate = proposalTemplatePages?.find((page) => page.id === templateId);
    if (proposalTemplate) {
      createProposal({
        title: proposalTemplate.title,
        contentText: proposalTemplate.contentText ?? '',
        content: proposalTemplate.content as PageContent,
        proposalTemplateId: templateId,
        evaluationType: proposalTemplate.proposal.evaluationType,
        authors: [],
        categoryId: proposalTemplate.proposal.categoryId as string,
        reviewers: proposalTemplate.proposal.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: (reviewer.roleId ?? reviewer.userId) as string
        })),
        rubricCriteria: proposalTemplate.proposal.rubricCriteria.map(({ id, ...criteria }) => criteria)
      });

      // mutateProposals();
      // mutatePage(newProposal);
      // setUrlWithoutRerender(router.pathname, { id: newProposal.id });
      // showProposal({
      //   pageId: newProposal.id,
      //   onClose() {
      //     setUrlWithoutRerender(router.pathname, { id: null });
      //   }
      // });
    }
  }

  async function createProposalTemplate() {
    if (currentSpace) {
      const newTemplate = await charmClient.proposals.createProposalTemplate({
        spaceId: currentSpace.id,
        categoryId: getDefaultCreateCategory()?.id as string
      });

      mutatePage(newTemplate);
      setUrlWithoutRerender(router.pathname, { id: newTemplate.id });
      showProposal({
        pageId: newTemplate.id,
        onClose() {
          setUrlWithoutRerender(router.pathname, { id: null });
        }
      });
    }
  }

  async function onClickCreate() {
    createProposal({
      category: null
    });
  }

  return (
    <>
      <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
        <Box>
          <ButtonGroup variant='contained' ref={buttonRef}>
            <Button disabled={!canCreateProposal} onClick={onClickCreate} data-test='new-proposal-button'>
              {isXsScreen ? 'Create' : 'Create Proposal'}
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
        editTemplate={(pageId) => {
          setUrlWithoutRerender(router.pathname, { id: pageId });
          showProposal({
            pageId,
            onClose() {
              setUrlWithoutRerender(router.pathname, { id: null });
            }
          });
        }}
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
